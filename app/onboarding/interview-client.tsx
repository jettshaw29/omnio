"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { JourneyHeader } from "@/components/journey-header";
import { requestNextStep, lockNiche } from "./actions";
import type { InterviewMessage, InterviewStep, NicheOption } from "@/lib/ai/interview";

type Phase = "asking" | "acknowledging" | "thinking" | "locking";

// 01_MISSION_CONTROL_UX.md §3: one question at a time, full attention,
// no progress bar, a quiet acknowledgment instead of a counter.
export function InterviewClient({
  agencyId,
  brandName,
  initialStep,
}: {
  agencyId: string;
  brandName: string | null;
  initialStep: InterviewStep;
}) {
  const [history, setHistory] = useState<InterviewMessage[]>([]);
  const [step, setStep] = useState<InterviewStep>(initialStep);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("asking");
  const [visible, setVisible] = useState(true);

  async function submitAnswer() {
    if (step.kind !== "question" || !answer.trim()) return;

    const newHistory: InterviewMessage[] = [
      ...history,
      { role: "assistant", content: step.question },
      { role: "user", content: answer.trim() },
    ];

    setAnswer("");
    setVisible(false);
    setPhase("acknowledging");
    await sleep(400);

    setPhase("thinking");
    const next = await requestNextStep(newHistory);

    setHistory(newHistory);
    setStep(next);
    setPhase("asking");
    setVisible(true);
  }

  async function selectNiche(niche: NicheOption) {
    if (step.kind !== "niches") return;
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
      <div
        className={`max-w-[640px] w-full flex flex-col gap-6 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {phase === "acknowledging" && (
          <p className="text-body text-text-secondary">Got it — that&apos;s helpful.</p>
        )}
        {phase === "thinking" && (
          <p className="text-body text-text-secondary">
            Thinking about what to ask next...
          </p>
        )}

        {phase === "asking" && step.kind === "question" && (
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
            <Button
              variant="primary"
              onClick={submitAnswer}
              disabled={!answer.trim()}
              className="self-start"
            >
              Continue
            </Button>
          </>
        )}

        {(phase === "asking" || phase === "locking") && step.kind === "niches" && (
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
      </main>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
