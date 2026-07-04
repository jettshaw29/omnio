import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";
import { extractJson } from "./dev-mode";

// Price and deposit are deliberately NOT part of this type — same rule as
// the website's pricing block (lib/ai/website.ts): the investment is
// rendered from the locked Offer directly, never separately generated, so a
// proposal can never quote a different number than what's actually on file.
export type ProposalContent = {
  recap: string;
  whatsIncluded: string;
  timeline: string;
  guarantee: string;
  nextStep: string;
};

type ProposalContext = {
  niche: string;
  service: string;
  brandName: string;
  positioning: string;
};

const systemPrompt = (ctx: ProposalContext, leadName: string, leadBusiness: string) => `You are Omnio, an experienced, calm agency owner. Full expertise below.

${getPlaybook()}

Draft a one-page proposal using Playbook §14's structure, for ${leadName} at ${leadBusiness}, following a discovery call. Agency: "${ctx.brandName}" (${ctx.positioning}). Niche: "${ctx.niche}". Offer: "${ctx.service}".

Fields:
- recap: one sentence recapping their likely situation in their own terms (their business type and the specific pain this niche feels — not fabricated specifics from a call that didn't happen in text).
- whatsIncluded: what's included in the engagement, one or two sentences.
- timeline: how fast this goes live.
- guarantee: the risk reversal, one sentence.
- nextStep: a simple, low-friction next step (e.g. reply to confirm).

Never invent details about the prospect that aren't knowable from their name/business alone.`;

// Dev-mode prompt + parser (see offer.ts).
export function buildProposalPrompt(
  leadName: string,
  leadBusiness: string,
  ctx: ProposalContext
): string {
  return `${systemPrompt(ctx, leadName, leadBusiness)}

---

Respond with ONLY a JSON object in exactly this shape, nothing else:
{
  "recap": "one sentence recapping their likely situation in their own terms",
  "whats_included": "what's included, one or two sentences",
  "timeline": "how fast this goes live",
  "guarantee": "the risk reversal, one sentence",
  "next_step": "a simple, low-friction next step"
}`;
}

export function parseProposalResponse(raw: string): ProposalContent {
  const input = extractJson<{
    recap: string;
    whats_included: string;
    timeline: string;
    guarantee: string;
    next_step: string;
  }>(raw);
  return {
    recap: input.recap,
    whatsIncluded: input.whats_included,
    timeline: input.timeline,
    guarantee: input.guarantee,
    nextStep: input.next_step,
  };
}

const PROPOSAL_TOOL: Anthropic.Tool = {
  name: "draft_proposal",
  description: "Call this once with the drafted proposal.",
  input_schema: {
    type: "object",
    properties: {
      recap: { type: "string" },
      whats_included: { type: "string" },
      timeline: { type: "string" },
      guarantee: { type: "string" },
      next_step: { type: "string" },
    },
    required: ["recap", "whats_included", "timeline", "guarantee", "next_step"],
  },
};

function mockProposal(
  leadName: string,
  leadBusiness: string,
  ctx: ProposalContext
): ProposalContent {
  return {
    recap: `Great talking through what ${leadBusiness} has been dealing with — it's a common, expensive problem for businesses like theirs.`,
    whatsIncluded: `A fully set up and tested ${ctx.service}, configured specifically for ${leadBusiness}, plus a walkthrough on how to monitor it.`,
    timeline: "Live within about a week of getting started.",
    guarantee:
      "If this doesn't save real time in the first 30 days, the remaining balance is waived.",
    nextStep: `Reply "let's go" and ${ctx.brandName} will send over the agreement and deposit link.`,
  };
}

export async function getProposal(
  leadName: string,
  leadBusiness: string,
  ctx: ProposalContext
): Promise<ProposalContent> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[proposal] ANTHROPIC_API_KEY not set — using mock proposal.");
    return mockProposal(leadName, leadBusiness, ctx);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 768,
    system: [
      {
        type: "text",
        text: systemPrompt(ctx, leadName, leadBusiness),
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [PROPOSAL_TOOL],
    tool_choice: { type: "tool", name: "draft_proposal" },
    messages: [{ role: "user", content: "Draft the proposal." }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  const input = toolUse?.input as {
    recap: string;
    whats_included: string;
    timeline: string;
    guarantee: string;
    next_step: string;
  };

  return {
    recap: input.recap,
    whatsIncluded: input.whats_included,
    timeline: input.timeline,
    guarantee: input.guarantee,
    nextStep: input.next_step,
  };
}
