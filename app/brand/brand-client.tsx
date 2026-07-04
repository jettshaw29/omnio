"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JourneyHeader } from "@/components/journey-header";
import { confirmBrand, regenerateBrand } from "./actions";
import type { BrandProposal } from "@/lib/ai/brand";

// Brand Review — same confirm-then-continue pattern as Offer Review
// (08_SCREEN_SPECIFICATIONS.md). Runs after Offer so the brand is built
// around a real, priced service rather than the reverse.
export function BrandClient({
  agencyId,
  brandName,
  niche,
  service,
  initialProposal,
}: {
  agencyId: string;
  brandName: string | null;
  niche: string;
  service: string;
  initialProposal: BrandProposal;
}) {
  const [proposal, setProposal] = useState(initialProposal);
  const [name, setName] = useState(initialProposal.name);
  const [positioning, setPositioning] = useState(initialProposal.positioning);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleRegenerate() {
    setIsRegenerating(true);
    const fresh = await regenerateBrand(niche, service);
    setProposal(fresh);
    setName(fresh.name);
    setPositioning(fresh.positioning);
    setIsRegenerating(false);
  }

  async function handleConfirm() {
    setIsConfirming(true);
    await confirmBrand(agencyId, name, positioning);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <JourneyHeader brandName={brandName} />
      <main className="flex-1 flex items-center justify-center px-6">
      <Card className="max-w-[640px] w-full p-8 flex flex-col gap-6">
        <h1 className="text-h1 font-semibold text-text-primary">
          {name || "Here's your brand."}
        </h1>
        <p className="text-body-lg text-text-secondary">
          {isRegenerating ? "Thinking about a different angle..." : proposal.reasoning}
        </p>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-small font-medium text-text-primary">Agency name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-body-lg text-text-primary bg-surface border border-border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-pine"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-small font-medium text-text-primary">
              Positioning statement
            </span>
            <textarea
              rows={3}
              value={positioning}
              onChange={(e) => setPositioning(e.target.value)}
              className="text-body-lg text-text-primary bg-surface border border-border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-pine resize-none"
            />
          </label>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!name.trim() || !positioning.trim() || isConfirming}
          >
            Confirm & Continue
          </Button>
          <Button variant="text" onClick={handleRegenerate} disabled={isRegenerating || isConfirming}>
            Try a different angle
          </Button>
        </div>
      </Card>
      </main>
    </div>
  );
}
