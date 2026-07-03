import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";

// Pricing is deliberately NOT part of this type — it's rendered straight from
// the locked Offer (Agency.offerService/offerPriceCents), never a separately
// generated value, so the site can never drift from the real offer
// (02_TECH_ARCHITECTURE.md's "one source of truth per artifact").
export type WebsiteContent = {
  headline: string;
  subheadline: string;
  problem: string;
  solutionSteps: [string, string, string];
  proof: string;
  guarantee: string;
  ctaLabel: string;
};

type WebsiteContext = {
  niche: string;
  service: string;
  brandName: string;
  positioning: string;
};

const FIELD_DESCRIPTIONS: Record<keyof WebsiteContent, string> = {
  headline: "The outcome, not the technology. One line.",
  subheadline: "Who it's for and how it works. One line.",
  problem: "Agitate the specific, felt pain. A short paragraph, one or two sentences.",
  solutionSteps: "Exactly three simple steps, no jargon, each a short phrase.",
  proof: "Proof for a beginner with no clients yet — a founding-client offer or a self-demo, never a fabricated testimonial (Playbook §8).",
  guarantee: "A concrete risk-reversal, one sentence.",
  ctaLabel: "A short call-to-action button label, e.g. 'Book a free call'.",
};

const systemPrompt = (ctx: WebsiteContext) => `You are Omnio, an experienced, calm agency owner. Full expertise below.

${getPlaybook()}

Generate this one-page website for a new agency, following Playbook §7's exact structure. Niche: "${ctx.niche}". Offer: "${ctx.service}". Brand: "${ctx.brandName}". Positioning: "${ctx.positioning}".

Never fabricate a testimonial or a result that doesn't exist yet (Playbook §8, Article VI) — the proof section must be honest about having no clients yet.`;

const WEBSITE_TOOL: Anthropic.Tool = {
  name: "generate_website_content",
  description: "Call this once with all seven sections of the one-page website.",
  input_schema: {
    type: "object",
    properties: {
      headline: { type: "string", description: FIELD_DESCRIPTIONS.headline },
      subheadline: { type: "string", description: FIELD_DESCRIPTIONS.subheadline },
      problem: { type: "string", description: FIELD_DESCRIPTIONS.problem },
      solution_steps: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 3,
        description: FIELD_DESCRIPTIONS.solutionSteps,
      },
      proof: { type: "string", description: FIELD_DESCRIPTIONS.proof },
      guarantee: { type: "string", description: FIELD_DESCRIPTIONS.guarantee },
      cta_label: { type: "string", description: FIELD_DESCRIPTIONS.ctaLabel },
    },
    required: [
      "headline",
      "subheadline",
      "problem",
      "solution_steps",
      "proof",
      "guarantee",
      "cta_label",
    ],
  },
};

function mockWebsiteContent(ctx: WebsiteContext): WebsiteContent {
  return {
    headline: `Stop losing business to ${ctx.niche.toLowerCase().includes("call") ? "missed calls" : "slow follow-up"}.`,
    subheadline: `${ctx.brandName} builds your ${ctx.service} — live in about a week.`,
    problem:
      "Every missed response is a customer who just went to a competitor instead — and most businesses never see it happen.",
    solutionSteps: [
      "We set up your AI system in about a week.",
      "It handles the repetitive work automatically, day and night.",
      "You see every result in one simple weekly summary.",
    ],
    proof:
      "I'm taking on a small number of founding clients right now at a reduced rate in exchange for an honest case study — I'd rather earn your trust with a real result than a stock testimonial.",
    guarantee:
      "If this doesn't save you real time in the first 30 days, you don't pay the remaining balance.",
    ctaLabel: "Book a free 15-minute call",
  };
}

export async function getWebsiteContent(ctx: WebsiteContext): Promise<WebsiteContent> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[website] ANTHROPIC_API_KEY not set — using mock website content.");
    return mockWebsiteContent(ctx);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: [{ type: "text", text: systemPrompt(ctx), cache_control: { type: "ephemeral" } }],
    tools: [WEBSITE_TOOL],
    tool_choice: { type: "tool", name: "generate_website_content" },
    messages: [{ role: "user", content: "Generate my website." }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  const input = toolUse?.input as {
    headline: string;
    subheadline: string;
    problem: string;
    solution_steps: string[];
    proof: string;
    guarantee: string;
    cta_label: string;
  };

  return {
    headline: input.headline,
    subheadline: input.subheadline,
    problem: input.problem,
    solutionSteps: [input.solution_steps[0], input.solution_steps[1], input.solution_steps[2]],
    proof: input.proof,
    guarantee: input.guarantee,
    ctaLabel: input.cta_label,
  };
}
