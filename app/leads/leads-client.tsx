"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { addLead, draftOutreachForLead, updateLeadStatus } from "./actions";
import type { Lead } from "@/generated/prisma/client";
import type { OutreachContext } from "@/lib/ai/outreach";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "call_booked", label: "Call Booked" },
  { value: "closed", label: "Closed" },
  { value: "lost", label: "Lost" },
];

// Leads — 01_MISSION_CONTROL_UX.md §2's "Get Clients" screen. Wider 960px
// grid per 07_VISUAL_DESIGN_SYSTEM.md §6, since comparing multiple leads at
// once is the actual job here, unlike the narrow single-focus flows.
export function LeadsClient({
  agencyId,
  leads,
  ctx,
}: {
  agencyId: string;
  leads: Lead[];
  ctx: OutreachContext;
}) {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim() || !business.trim()) return;
    setIsAdding(true);
    await addLead(agencyId, name.trim(), business.trim());
    setName("");
    setBusiness("");
    setIsAdding(false);
  }

  async function handleDraft(leadId: string) {
    setDraftingId(leadId);
    const message = await draftOutreachForLead(leadId, ctx);
    setDrafts((prev) => ({ ...prev, [leadId]: message }));
    setDraftingId(null);
  }

  async function handleCopy(leadId: string) {
    await navigator.clipboard.writeText(drafts[leadId]);
    setCopiedId(leadId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16">
      <div className="max-w-[960px] w-full flex flex-col gap-8">
        <h1 className="text-h1 font-semibold text-text-primary">Your leads</h1>

        <Card className="p-6 flex items-end gap-4">
          <label className="flex flex-col gap-2 flex-1">
            <span className="text-small font-medium text-text-primary">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-body text-text-primary bg-surface border border-border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pine"
            />
          </label>
          <label className="flex flex-col gap-2 flex-1">
            <span className="text-small font-medium text-text-primary">Business</span>
            <input
              type="text"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              className="text-body text-text-primary bg-surface border border-border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pine"
            />
          </label>
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={!name.trim() || !business.trim() || isAdding}
          >
            Add Lead
          </Button>
        </Card>

        {leads.length === 0 ? (
          <p className="text-body-lg text-text-secondary">
            No leads yet — once you&apos;re live, this is where you&apos;ll track everyone
            you reach out to.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {leads.map((lead) => (
              <Card key={lead.id} className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-body-lg font-medium text-text-primary">{lead.name}</p>
                    <p className="text-body text-text-secondary">{lead.business}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                      className="text-body text-text-primary bg-surface border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pine"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="text"
                      onClick={() => handleDraft(lead.id)}
                      disabled={draftingId === lead.id}
                    >
                      {draftingId === lead.id ? "Thinking..." : "Draft Outreach"}
                    </Button>
                  </div>
                </div>

                {drafts[lead.id] && (
                  <div className="flex flex-col gap-2 bg-background border border-border rounded-md p-4">
                    <p className="text-body text-text-primary whitespace-pre-wrap">
                      {drafts[lead.id]}
                    </p>
                    <Button
                      variant="text"
                      onClick={() => handleCopy(lead.id)}
                      className="self-start"
                    >
                      {copiedId === lead.id ? "Copied ✓" : "Copy"}
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
