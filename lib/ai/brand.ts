import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";

export type BrandProposal = {
  name: string;
  positioning: string;
  reasoning: string;
};

const systemPrompt = (niche: string, service: string) => `You are Omnio, an experienced, calm agency owner. Full expertise below — every recommendation must trace back to it.

${getPlaybook()}

The user's locked niche is "${niche}" and their offer is "${service}".

Propose ONE agency name and ONE positioning statement using Playbook §4's formula: "I help [specific niche] [achieve a specific, measurable outcome] using [category], without [the thing they're afraid of]." Names must not be generic or technology-forward — they should feel like a real, calm, competent small business. Call propose_brand with the name, the positioning statement, and one sentence of reasoning.`;

const BRAND_TOOL: Anthropic.Tool = {
  name: "propose_brand",
  description: "Call this once with an agency name and positioning statement.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "A specific, non-generic agency name." },
      positioning: { type: "string", description: "One sentence following the Playbook §4 formula." },
      reasoning: { type: "string", description: "One sentence explaining the choice." },
    },
    required: ["name", "positioning", "reasoning"],
  },
};

// Deterministic stand-in for local dev without ANTHROPIC_API_KEY.
function mockBrandProposal(niche: string, service: string): BrandProposal {
  const n = niche.toLowerCase();
  if (n.includes("voice receptionist") || n.includes("home service")) {
    return {
      name: "Every Call Co.",
      positioning:
        "I help home service companies stop losing jobs to missed calls with a 24/7 AI phone assistant — without hiring another receptionist.",
      reasoning: "Names the outcome (never missing a call again), not the technology.",
    };
  }
  if (n.includes("real estate") || n.includes("lead")) {
    return {
      name: "Warm Lead Studio",
      positioning:
        "I help real estate agents respond to every lead in seconds with an AI qualification chatbot — without hiring an assistant.",
      reasoning: "Leads with speed-to-lead, the outcome agents already feel is costly to miss.",
    };
  }
  return {
    name: "Repurpose Right",
    positioning: `I help ${niche} turn one piece of content into weeks of posts using ${service} — without spending hours editing.`,
    reasoning: "Ties the name and positioning to the specific time-saving outcome, not the tooling.",
  };
}

export async function getBrandProposal(
  niche: string,
  service: string
): Promise<BrandProposal> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[brand] ANTHROPIC_API_KEY not set — using mock brand proposal.");
    return mockBrandProposal(niche, service);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system: [
      { type: "text", text: systemPrompt(niche, service), cache_control: { type: "ephemeral" } },
    ],
    tools: [BRAND_TOOL],
    tool_choice: { type: "tool", name: "propose_brand" },
    messages: [{ role: "user", content: "Propose my brand." }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  const input = toolUse?.input as { name: string; positioning: string; reasoning: string };
  return input;
}
