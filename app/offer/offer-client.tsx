"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JourneyHeader } from "@/components/journey-header";
import { DevAiStep } from "@/components/dev-ai-step";
import { confirmOffer, regenerateOffer } from "./actions";
import type { OfferProposal } from "@/lib/ai/offer";

// Offer Review, per 08_SCREEN_SPECIFICATIONS.md's confirm-then-continue
// pattern: the AI proposes, the user edits and locks it in (Article V — the
// AI assists, the human decides).
export function OfferClient({
  agencyId,
  brandName,
  niche,
  initialProposal,
  devPrompt,
}: {
  agencyId: string;
  brandName: string | null;
  niche: string;
  initialProposal: OfferProposal | null;
  devPrompt: string | null;
}) {
  const [proposal, setProposal] = useState<OfferProposal | null>(initialProposal);
  const [service, setService] = useState(initialProposal?.service ?? "");
  const [priceDollars, setPriceDollars] = useState(
    initialProposal ? (initialProposal.priceCents / 100).toString() : ""
  );
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  function applyProposal(p: OfferProposal) {
    setProposal(p);
    setService(p.service);
    setPriceDollars((p.priceCents / 100).toString());
  }

  async function handleRegenerate() {
    // In dev mode, "regenerate" just re-opens the paste panel with the same
    // prompt so a different response can be pasted.
    if (devPrompt) {
      setProposal(null);
      return;
    }
    setIsRegenerating(true);
    applyProposal(await regenerateOffer(niche));
    setIsRegenerating(false);
  }

  async function handleConfirm() {
    setIsConfirming(true);
    await confirmOffer(agencyId, service, Number(priceDollars) || 0);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <JourneyHeader brandName={brandName} />
      <main className="flex-1 flex items-center justify-center px-6">
        {!proposal && devPrompt ? (
          <DevAiStep
            touchpoint="offer"
            title="Offer proposal"
            prompt={devPrompt}
            onResult={(parsed) => applyProposal(parsed as OfferProposal)}
          />
        ) : (
          <Card className="max-w-[640px] w-full p-8 flex flex-col gap-6">
            <h1 className="text-h1 font-semibold text-text-primary">
              Here&apos;s what I&apos;d sell.
            </h1>
            <p className="text-body-lg text-text-secondary">
              {isRegenerating ? "Thinking about a different angle..." : proposal?.reasoning}
            </p>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-small font-medium text-text-primary">Service</span>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="text-body-lg text-text-primary bg-surface border border-border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-pine"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-small font-medium text-text-primary">Price (USD)</span>
                <div className="flex items-center gap-2">
                  <span className="text-body-lg text-text-secondary">$</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={priceDollars}
                    onChange={(e) => setPriceDollars(e.target.value)}
                    className="text-body-lg text-text-primary bg-surface border border-border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-pine w-full"
                  />
                </div>
                <span className="text-small text-text-secondary">
                  At this price, one signed client is your first $1,000.
                </span>
              </label>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={!service.trim() || isConfirming}
              >
                Confirm & Continue
              </Button>
              <Button
                variant="text"
                onClick={handleRegenerate}
                disabled={isRegenerating || isConfirming}
              >
                Try a different offer
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
