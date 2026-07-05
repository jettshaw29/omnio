"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JourneyHeader } from "@/components/journey-header";
import { DevAiStep } from "@/components/dev-ai-step";
import { saveProspectStrategy } from "./actions";
import type { ProspectStrategy } from "@/lib/ai/prospect";

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-small font-medium text-text-primary uppercase tracking-wide">
        {title}
      </span>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="text-body text-text-secondary">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProspectClient({
  agencyId,
  brandName,
  niche,
  initialStrategy,
  devPrompt,
}: {
  agencyId: string;
  brandName: string | null;
  niche: string;
  initialStrategy: ProspectStrategy | null;
  devPrompt: string | null;
}) {
  const router = useRouter();
  const [strategy, setStrategy] = useState<ProspectStrategy | null>(initialStrategy);
  const [isSaving, setIsSaving] = useState(false);

  async function handleDevResult(parsed: unknown) {
    const s = parsed as ProspectStrategy;
    await saveProspectStrategy(agencyId, s);
    setStrategy(s);
    router.refresh();
  }

  async function handleStartOutreach() {
    setIsSaving(true);
    router.push("/leads");
  }

  if (!strategy) {
    return (
      <div className="min-h-screen flex flex-col">
        <JourneyHeader brandName={brandName} />
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          {devPrompt ? (
            <DevAiStep
              touchpoint="prospect"
              title="Find your first 25 prospects"
              prompt={devPrompt}
              onResult={handleDevResult}
            />
          ) : (
            <p className="text-body-lg text-text-secondary">
              Building your prospect strategy...
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
          <div className="flex flex-col gap-2">
            <h1 className="text-h1 font-semibold text-text-primary">
              Find your first 25 prospects.
            </h1>
            <p className="text-body-lg text-text-secondary">
              Here&apos;s exactly where to look and what to look for in{" "}
              <span className="text-text-primary font-medium">{niche}</span>.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <Section title="Where to look" items={strategy.whereToLook} />
            <div className="border-t border-border" />
            <Section title="What to search" items={strategy.whatToSearch} />
            <div className="border-t border-border" />
            <Section title="Good signs" items={strategy.qualifyingSignals} />
            <div className="border-t border-border" />
            <Section title="Skip these" items={strategy.redFlags} />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-small text-text-tertiary">
              Build a list of 25 names, businesses, and phone numbers or email addresses.
              When you&apos;re ready, Omnio will write your first message.
            </p>
            <Button variant="primary" onClick={handleStartOutreach} disabled={isSaving}>
              {isSaving ? "Let's go..." : "I have my list — start outreach"}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
