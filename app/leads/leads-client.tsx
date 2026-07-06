"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JourneyHeader } from "@/components/journey-header";
import { DevAiStep } from "@/components/dev-ai-step";
import {
  addLead,
  draftOutreachForLead,
  draftFollowUpForLead,
  getOutreachDevPrompt,
  updateLeadStatus,
} from "./actions";
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
  brandName,
  leads,
  ctx,
  devMode,
}: {
  agencyId: string;
  brandName: string | null;
  leads: Lead[];
  ctx: OutreachContext;
  devMode: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [followUpDrafts, setFollowUpDrafts] = useState<Record<string, string>>({});
  const [devPrompts, setDevPrompts] = useState<Record<string, string>>({});
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [draftingFollowUpId, setDraftingFollowUpId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedFollowUpId, setCopiedFollowUpId] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim() || !business.trim()) return;
    setIsAdding(true);
    await addLead(agencyId, name.trim(), business.trim());
    setName("");
    setBusiness("");
    setIsAdding(false);
    router.refresh();
  }

  async function handleDraft(leadId: string) {
    setDraftingId(leadId);
    if (devMode) {
      // Fetch the exact per-lead prompt and open the paste panel inline.
      const prompt = await getOutreachDevPrompt(leadId, ctx);
      setDevPrompts((prev) => ({ ...prev, [leadId]: prompt }));
      setDraftingId(null);
      return;
    }
    const message = await draftOutreachForLead(leadId, ctx);
    setDrafts((prev) => ({ ...prev, [leadId]: message }));
    setDraftingId(null);
  }

  async function handleCopy(leadId: string) {
    await navigator.clipboard.writeText(drafts[leadId]);
    setCopiedId(leadId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleDraftFollowUp(leadId: string) {
    setDraftingFollowUpId(leadId);
    const message = await draftFollowUpForLead(leadId, ctx);
    setFollowUpDrafts((prev) => ({ ...prev, [leadId]: message }));
    setDraftingFollowUpId(null);
  }

  async function handleCopyFollowUp(leadId: string) {
    await navigator.clipboard.writeText(followUpDrafts[leadId]);
    setCopiedFollowUpId(leadId);
    setTimeout(() => setCopiedFollowUpId(null), 1500);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <JourneyHeader brandName={brandName} />
      <main className="flex-1 flex flex-col items-center px-6 py-16">
      <div className="max-w-[960px] w-full flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 font-semibold text-text-primary">Your leads</h1>
          <p className="text-body text-text-secondary">
            Search Google Maps or Yelp for your niche in your city — those are real businesses.
            Start with 5, check each one against your prospect criteria, add the ones that qualify.
          </p>
        </div>

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
            No leads yet. Add your first one above — start with the businesses from your
            prospect list.
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
                      onChange={async (e) => { await updateLeadStatus(lead.id, e.target.value); router.refresh(); }}
                      className="text-body text-text-primary bg-surface border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pine"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {lead.status === "contacted" ? (
                      <Button
                        variant="text"
                        onClick={() => handleDraftFollowUp(lead.id)}
                        disabled={draftingFollowUpId === lead.id}
                      >
                        {draftingFollowUpId === lead.id ? "Thinking..." : "Draft Follow-up"}
                      </Button>
                    ) : (
                      <Button
                        variant="text"
                        onClick={() => handleDraft(lead.id)}
                        disabled={draftingId === lead.id}
                      >
                        {draftingId === lead.id ? "Thinking..." : "Draft Outreach"}
                      </Button>
                    )}
                    {lead.status === "call_booked" && (
                      <Button variant="text" href={`/close/${lead.id}`}>
                        Close Client
                      </Button>
                    )}
                  </div>
                </div>

                {devPrompts[lead.id] && !drafts[lead.id] && (
                  <DevAiStep
                    touchpoint="outreach"
                    title={`Outreach for ${lead.name}`}
                    prompt={devPrompts[lead.id]}
                    onResult={(parsed) => {
                      setDrafts((prev) => ({ ...prev, [lead.id]: parsed as string }));
                      setDevPrompts((prev) => {
                        const next = { ...prev };
                        delete next[lead.id];
                        return next;
                      });
                    }}
                  />
                )}

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
                    <p className="text-small text-text-secondary">
                      Find their email in their website footer, or message their Facebook or
                      Instagram business page. Once sent, mark them as Contacted using the
                      status dropdown above.
                    </p>
                  </div>
                )}

                {followUpDrafts[lead.id] && (
                  <div className="flex flex-col gap-2 bg-background border border-border rounded-md p-4">
                    <p className="text-small font-medium text-text-secondary">Follow-up</p>
                    <p className="text-body text-text-primary whitespace-pre-wrap">
                      {followUpDrafts[lead.id]}
                    </p>
                    <Button
                      variant="text"
                      onClick={() => handleCopyFollowUp(lead.id)}
                      className="self-start"
                    >
                      {copiedFollowUpId === lead.id ? "Copied ✓" : "Copy"}
                    </Button>
                    <p className="text-small text-text-secondary">
                      Send this 4–5 days after your first message. If you emailed, try their
                      Instagram or Facebook page this time — different channel, same ask.
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {leads.length > 0 && (
          <p className="text-small text-text-secondary">
            When someone agrees to a call, change their status to{" "}
            <span className="font-medium text-text-primary">Call Booked</span> — that
            unlocks your call prep and moves Mission Control forward.
          </p>
        )}

        {leads.some((l) => l.status === "contacted") && (
          <div className="bg-surface border border-border rounded-md p-6 flex flex-col gap-4">
            <h2 className="text-body font-semibold text-text-primary">
              Nobody&apos;s replied yet — here&apos;s what to do.
            </h2>
            <div className="flex flex-col gap-3">
              <SilenceTip
                label="Follow up in 4–5 days."
                body='Use "Draft Follow-up" on any contacted lead. Keep it short — 2 sentences and a yes/no question. Most deals close on the second or third touch, not the first.'
              />
              <SilenceTip
                label="Switch channels."
                body="If you emailed, try their Instagram or Facebook business page next. Different door, same message. Many small business owners check social more than email."
              />
              <SilenceTip
                label="10+ contacted with no replies? Change your opener."
                body="The first sentence is probably the problem. Try opening with something specific you noticed about their business instead of leading with your offer."
              />
              <SilenceTip
                label="A 10–15% reply rate is normal."
                body="If you reach 25 people and 3 reply, that's a healthy start. Silence isn't rejection — it's usually just noise. Keep adding leads and keep sending."
              />
            </div>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}

function SilenceTip({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-body font-medium text-text-primary">{label}</span>
      <p className="text-body text-text-secondary">{body}</p>
    </div>
  );
}
