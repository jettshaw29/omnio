"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoneyCounter } from "@/components/money-counter";

/**
 * The Milestone Moment template (08_SCREEN_SPECIFICATIONS.md §6-7) — one
 * template, reused for every milestone, per 06_DESIGN_PRINCIPLES.md §10.
 * Full takeover, Gold accent used nowhere else in the product, gentle
 * scale-and-fade motion. Deliberately no confetti (07_VISUAL_DESIGN_SYSTEM.md
 * §20) and no preview of the next task — the moment gets to be uninterrupted.
 */
export function CelebrationScreen({
  headline,
  subline,
  nextHref,
  moneyCounter,
}: {
  headline: string;
  subline: string;
  nextHref: string;
  moneyCounter?: { fromCents: number; toCents: number };
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(circle at center, rgba(201,154,60,0.18), transparent 60%)",
          opacity: visible ? 1 : 0,
        }}
      />
      <div
        className={`relative flex flex-col items-center gap-6 text-center px-6 max-w-xl transition-all duration-500 ease-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {moneyCounter && (
          <MoneyCounter fromCents={moneyCounter.fromCents} toCents={moneyCounter.toCents} />
        )}
        <h1 className="text-display font-semibold text-text-primary">{headline}</h1>
        <p className="text-body-lg text-text-secondary">{subline}</p>
        <Button variant="primary" href={nextHref}>
          Continue
        </Button>
      </div>
    </div>
  );
}
