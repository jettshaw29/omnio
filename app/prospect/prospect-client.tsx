"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JourneyHeader } from "@/components/journey-header";
import { DevAiStep } from "@/components/dev-ai-step";
import {
  saveProspectStrategy,
  evaluateProspectsAction,
  getEvalDevPrompt,
  markProspectEvaluated,
} from "./actions";
import type { ProspectStrategy, ProspectEvaluation, ProspectCandidate } from "@/lib/ai/prospect";

const VERDICT_STYLES: Record<ProspectCandidate["verdict"], { icon: string; label: string; labelColor: string }> = {
  keep: { icon: "✅", label: "Keep", labelColor: "text-pine" },
  check: { icon: "⚠️", label: "Check first", labelColor: "text-amber-700" },
  skip: { icon: "❌", label: "Skip", labelColor: "text-clay" },
};

function EvaluationResult({ evaluation }: { evaluation: ProspectEvaluation }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {evaluation.candidates.map((c, i) => {
          const style = VERDICT_STYLES[c.verdict];
          return (
            <div key={i} className="flex flex-col gap-2 pb-4 border-b border-border last:border-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span>{style.icon}</span>
                <span className="text-body font-semibold text-text-primary">{c.name}</span>
                <span className={`text-small font-medium ${style.labelColor} ml-auto`}>
                  {style.label}
                </span>
              </div>
              <p className="text-body text-text-secondary leading-relaxed">{c.coaching}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-surface border border-border rounded-md p-4">
        <p className="text-body text-text-primary leading-relaxed">{evaluation.summary}</p>
      </div>
    </div>
  );
}

export function ProspectClient({
  agencyId,
  brandName,
  niche,
  initialStrategy,
  devPrompt,
  devMode,
}: {
  agencyId: string;
  brandName: string | null;
  niche: string;
  initialStrategy: ProspectStrategy | null;
  devPrompt: string | null;
  devMode: boolean;
}) {
  const router = useRouter();
  const [strategy, setStrategy] = useState<ProspectStrategy | null>(initialStrategy);
  const [candidates, setCandidates] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<ProspectEvaluation | null>(null);
  const [evalDevPrompt, setEvalDevPrompt] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);

  async function handleDevStrategyResult(parsed: unknown) {
    const s = parsed as ProspectStrategy;
    await saveProspectStrategy(agencyId, s);
    setStrategy(s);
  }

  async function handleEvaluate() {
    if (!candidates.trim()) return;
    setIsEvaluating(true);
    if (devMode) {
      const prompt = await getEvalDevPrompt(agencyId, candidates);
      setEvalDevPrompt(prompt);
      setIsEvaluating(false);
      return;
    }
    const result = await evaluateProspectsAction(
      agencyId,
      candidates,
      niche,
      "",
      strategy!
    );
    setEvaluation(result);
    setIsEvaluating(false);
  }

  async function handleDevEvalResult(parsed: unknown) {
    const result = parsed as ProspectEvaluation;
    await markProspectEvaluated(agencyId);
    setEvaluation(result);
    setEvalDevPrompt(null);
  }

  async function handleStartOutreach() {
    setIsAdvancing(true);
    router.push("/leads");
  }

  // Phase 0: strategy not yet generated (dev mode waiting for paste)
  if (!strategy) {
    return (
      <div className="min-h-screen flex flex-col">
        <JourneyHeader brandName={brandName} />
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          {devPrompt ? (
            <DevAiStep
              touchpoint="prospect"
              title="What makes a qualified prospect"
              prompt={devPrompt}
              onResult={handleDevStrategyResult}
            />
          ) : (
            <p className="text-body-lg text-text-secondary">
              Building your prospect criteria...
            </p>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <JourneyHeader brandName={brandName} />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Card className="max-w-[640px] w-full p-8 flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-h1 font-semibold text-text-primary">
              Build a list of 25 qualified prospects.
            </h1>
            <p className="text-body-lg text-text-secondary">
              Not every business in your niche is worth contacting. Here&apos;s what separates
              a good prospect from a wasted message, for{" "}
              <span className="font-medium text-text-primary">{niche}</span>.
            </p>
          </div>

          {/* ICP Criteria */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <span className="text-small font-medium text-text-primary flex items-center gap-2">
                <span>✅</span> Look for
              </span>
              <ul className="flex flex-col gap-1.5">
                {strategy.lookFor.map((item, i) => (
                  <li key={i} className="text-body text-text-secondary">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border" />

            <div className="flex flex-col gap-2">
              <span className="text-small font-medium text-text-primary flex items-center gap-2">
                <span>❌</span> Skip these
              </span>
              <ul className="flex flex-col gap-1.5">
                {strategy.skip.map((item, i) => (
                  <li key={i} className="text-body text-text-secondary">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Confidence check */}
          <div className="border-t border-border pt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-body font-semibold text-text-primary">
                Before you build the full list — test your instincts.
              </span>
              <p className="text-body text-text-secondary">
                Find 3–5 businesses you think are a good fit. Paste their names below and
                what you noticed about them. Omnio will tell you if you&apos;re on track.
              </p>
              <p className="text-small text-text-secondary">
                Search Google Maps or Yelp for{" "}
                <span className="font-medium text-text-primary">{niche}</span> in your area
                to find real businesses to test your instincts on.
              </p>
            </div>

            {!evaluation && !evalDevPrompt && (
              <>
                <textarea
                  rows={5}
                  value={candidates}
                  onChange={(e) => setCandidates(e.target.value)}
                  placeholder={
                    "e.g.\nMike's Plumbing – active website, 40 Google reviews, no menu when you call\nGarcia HVAC – owner-operated, ran a Facebook ad last week\nHomeServe USA – seems big, might be a franchise"
                  }
                  className="text-body text-text-primary bg-surface border border-border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pine resize-none placeholder:text-text-tertiary"
                />
                <Button
                  variant="primary"
                  onClick={handleEvaluate}
                  disabled={isEvaluating || !candidates.trim()}
                >
                  {isEvaluating ? "Omnio is reviewing..." : "Are these good prospects?"}
                </Button>
              </>
            )}

            {evalDevPrompt && (
              <DevAiStep
                touchpoint="prospectEval"
                title="Prospect review"
                prompt={evalDevPrompt}
                onResult={handleDevEvalResult}
              />
            )}

            {evaluation && (
              <>
                <EvaluationResult evaluation={evaluation} />
                <div className="flex flex-col gap-2">
                  <p className="text-small text-text-secondary">
                    You know what to look for now. Find 20–25 more businesses that fit these
                    criteria, then add them in the next step and start reaching out.
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleStartOutreach}
                    disabled={isAdvancing}
                    className="self-start"
                  >
                    {isAdvancing ? "Let's go..." : "Start building my list"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
