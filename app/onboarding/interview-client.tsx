"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { JourneyHeader } from "@/components/journey-header";
import { DevAiStep } from "@/components/dev-ai-step";
import { requestNextStep, requestDevPrompt, lockNiche } from "./actions";
import type { InterviewMessage, InterviewStep, NicheOption } from "@/lib/ai/interview";

type Phase = "asking" | "acknowledging" | "thinking" | "locking";

// 01_MISSION_CONTROL_UX.md §3: one question at a time, full attention,
// no progress bar, a quiet acknowledgment instead of a counter.
//
// Dev mode: every turn that would call the API instead shows the exact
// prompt to relay by hand; the pasted response becomes the next step, and
// the interview continues exactly as if the API had answered.
export function InterviewClient({
  agencyId,
  brandName,
  initialStep,
  initialDevPrompt,
}: {
  agencyId: string;
  brandName: string | null;
  initialStep: InterviewStep | null;
  initialDevPrompt: string | null;
}) {
  const devMode = initialDevPrompt !== null;
  const [history, setHistory] = useState<InterviewMessage[]>([]);
  const [step, setStep] = useState<InterviewStep | null>(initialStep);
  const [devPrompt, setDevPrompt] = useState<string | null>(initialDevPrompt);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("asking");
  const [visible, setVisible] = useState(true);

  async function submitAnswer() {
    if (step?.kind !== "question" || !answer.trim()) return;

    const newHistory: InterviewMessage[] = [
      ...history,
      { role: "assistant", content: step.question },
      { role: "user", content: answer.trim() },
    ];

    setAnswer("");
    setVisible(false);
    setPhase("acknowledging");
    await sleep(400);

    if (devMode) {
      // Hand the next turn to the dev panel instead of the API.
      const prompt = await requestDevPrompt(newHistory);
      setHistory(newHistory);
      setStep(null);
      setDevPrompt(prompt);
      setPhase("asking");
      setVisible(true);
      return;
    }

    setPhase("thinking");
    const next = await requestNextStep(newHistory);

    setHistory(newHistory);
    setStep(next);
    setPhase("asking");
    setVisible(true);
  }

  async function selectNiche(niche: NicheOption) {
    if (step?.kind !== "niches") return;
    setPhase("locking");
    const finalHistory: InterviewMessage[] = [
      ...history,
      { role: "assistant", content: JSON.stringify(step.niches) },
      { role: "user", content: `Chose: ${niche.name}` },
    ];
    await lockNiche(agencyId, niche, finalHistory);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <JourneyHeader brandName={brandName} />
      <main className="flex-1 flex items-center justify-center px-6">
        {!step && devPrompt ? (
          <DevAiStep
            touchpoint="interview"
            title="Interview turn"
            prompt={devPrompt}
            onResult={(parsed) => {
              setStep(parsed as InterviewStep);
              setDevPrompt(null);
              setPhase("asking");
              setVisible(true);
            }}
          />
        ) : (
          <div
            className={`max-w-[640px] w-full flex flex-col gap-6 transition-opacity duration-300 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {(phase === "acknowledging" || phase === "thinking") && (
              <p className="text-body text-text-secondary">One more question...</p>
            )}

            {phase === "asking" && step?.kind === "question" && (
              <>
                <h1 className="text-h1 font-semibold text-text-primary">
                  {step.question}
                </h1>
                <textarea
                  autoFocus
                  rows={3}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitAnswer();
                    }
                  }}
                  placeholder="Type your answer..."
                  className="text-body-lg text-text-primary bg-surface border border-border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-pine resize-none"
                />
                <div className="flex items-center gap-4">
                  <Button
                    variant="primary"
                    onClick={submitAnswer}
                    disabled={!answer.trim()}
                    className="self-start"
                  >
                    Continue
                  </Button>
                  <span className="text-small text-text-tertiary">or press Enter</span>
                </div>
              </>
            )}

            {(phase === "asking" || phase === "locking") && step?.kind === "niches" && (
              <>
                <h1 className="text-h1 font-semibold text-text-primary">
                  Here&apos;s where I&apos;d start:
                </h1>
                <div className="flex flex-col gap-4">
                  {step.niches.map((niche) => (
                    <button
                      key={niche.name}
                      onClick={() => selectNiche(niche)}
                      disabled={phase === "locking"}
                      className="text-left bg-surface border border-border rounded-md p-6 shadow-resting hover:shadow-raised hover:border-pine transition-all duration-150 disabled:opacity-40"
                    >
                      <p className="text-body-lg font-medium text-text-primary">
                        {niche.name}
                      </p>
                      <p className="text-body text-text-secondary mt-2">
                        {niche.reasoning}
                      </p>
                    </button>
                  ))}
                </div>
                {phase === "locking" && (
                  <p className="text-body text-text-secondary">
                    Locking in your focus...
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
