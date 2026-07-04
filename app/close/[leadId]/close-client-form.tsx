"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JourneyHeader } from "@/components/journey-header";
import { regenerateProposal, signClient } from "./actions";
import type { ProposalContent } from "@/lib/ai/proposal";

// The minimum-viable contract checklist from 03_AI_AGENCY_PLAYBOOK.md §15 —
// generic best-practice items, not per-client content, so they're static
// rather than AI-generated.
const CONTRACT_CHECKLIST = [
  "Scope of work",
  "Timeline and delivery date",
  "Payment terms and due dates",
  "What happens if access/info is provided late",
  "Cancellation and refund terms",
  "Who owns the delivered system",
];

export function CloseClientForm({
  agencyId,
  brandName,
  leadId,
  leadName,
  offerService,
  offerPriceCents,
  initialProposal,
  ctx,
}: {
  agencyId: string;
  brandName: string | null;
  leadId: string;
  leadName: string;
  offerService: string;
  offerPriceCents: number;
  initialProposal: ProposalContent;
  ctx: { niche: string; service: string; brandName: string; positioning: string };
}) {
  const [proposal, setProposal] = useState(initialProposal);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [depositDollars, setDepositDollars] = useState(
    Math.round(offerPriceCents / 2 / 100).toString()
  );

  const price = (offerPriceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  async function handleRegenerate() {
    setIsRegenerating(true);
    const fresh = await regenerateProposal(leadId, ctx);
    setProposal(fresh);
    setIsRegenerating(false);
  }

  async function handleSign() {
    setIsSigning(true);
    await signClient(leadId, agencyId, Number(depositDollars) || 0);
  }

  function updateField(field: keyof ProposalContent, value: string) {
    setProposal((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="min-h-screen flex flex-col">
      <JourneyHeader brandName={brandName} />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
      <Card className="max-w-[640px] w-full p-8 flex flex-col gap-6">
        <h1 className="text-h1 font-semibold text-text-primary">
          Close {leadName.split(" ")[0]}.
        </h1>

        <Field label="Recap" value={proposal.recap} onChange={(v) => updateField("recap", v)} />
        <Field
          label="What's included"
          value={proposal.whatsIncluded}
          onChange={(v) => updateField("whatsIncluded", v)}
        />
        <Field
          label="Timeline"
          value={proposal.timeline}
          onChange={(v) => updateField("timeline", v)}
        />

        <div className="flex flex-col gap-2 bg-background border border-border rounded-md p-6">
          <span className="text-small text-text-secondary">{offerService}</span>
          <p className="text-h2 font-semibold text-pine">{price}</p>
        </div>

        <Field
          label="Guarantee"
          value={proposal.guarantee}
          onChange={(v) => updateField("guarantee", v)}
        />
        <Field
          label="Next step"
          value={proposal.nextStep}
          onChange={(v) => updateField("nextStep", v)}
        />

        <label className="flex flex-col gap-2">
          <span className="text-small font-medium text-text-primary">Deposit (USD)</span>
          <div className="flex items-center gap-2">
            <span className="text-body-lg text-text-secondary">$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={depositDollars}
              onChange={(e) => setDepositDollars(e.target.value)}
              className="text-body-lg text-text-primary bg-surface border border-border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-pine w-full"
            />
          </div>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-small font-medium text-text-primary">
            Contract checklist
          </span>
          <ul className="flex flex-col gap-1">
            {CONTRACT_CHECKLIST.map((item) => (
              <li key={item} className="text-body text-text-secondary">
                • {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="primary" onClick={handleSign} disabled={isSigning}>
            {isSigning ? "Signing..." : "Mark as Signed"}
          </Button>
          <Button variant="text" onClick={handleRegenerate} disabled={isRegenerating || isSigning}>
            {isRegenerating ? "Thinking of a different angle..." : "Try a different angle"}
          </Button>
        </div>
      </Card>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-small font-medium text-text-primary">{label}</span>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-body text-text-primary bg-surface border border-border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pine resize-none"
      />
    </label>
  );
}
