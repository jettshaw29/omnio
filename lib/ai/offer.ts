import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";
import { extractJson } from "./dev-mode";

export type OfferProposal = {
  service: string;
  priceCents: number;
  reasoning: string;
};

const systemPrompt = (niche: string) => `You are Omnio, an experienced, calm agency owner. Full expertise below — every recommendation must trace back to it.

${getPlaybook()}

The user's locked niche is: "${niche}".

Propose ONE productized service offer for this niche, using Playbook §3 (service selection) and §6 (offer creation). Price it per §5 — specifically, structure the price so a single closed deal's deposit alone can reach the $1,000 milestone in one motion, which is the single highest-leverage pricing decision for a new agency. Call propose_offer with a specific, named service (not "custom AI solutions"), a whole-dollar price, and one concrete sentence of reasoning grounded in this niche.`;

// Dev-mode: the exact prompt a human pastes into Claude, plus the parser for
// what they paste back. Same system prompt as the live call — only the output
// mechanism differs (JSON in chat vs. a forced tool call), so what we're
// validating (the instructions + context) is identical.
export function buildOfferPrompt(niche: string): string {
  return `${systemPrompt(niche)}

---

Respond with ONLY a JSON object in exactly this shape, nothing else:
{
  "service": "a specific, named productized service (never 'custom AI solutions')",
  "price_dollars": 2000,
  "reasoning": "one concrete sentence tied to this niche"
}`;
}

export function parseOfferResponse(raw: string): OfferProposal {
  const input = extractJson<{ service: string; price_dollars: number; reasoning: string }>(raw);
  return {
    service: input.service,
    priceCents: Math.round(input.price_dollars * 100),
    reasoning: input.reasoning,
  };
}

const OFFER_TOOL: Anthropic.Tool = {
  name: "propose_offer",
  description: "Call this once with a specific productized offer for the locked niche.",
  input_schema: {
    type: "object",
    properties: {
      service: { type: "string", description: "A specific, named productized service." },
      price_dollars: { type: "number", description: "Whole-dollar price, structured per Playbook §5." },
      reasoning: { type: "string", description: "One concrete sentence tied to this specific niche." },
    },
    required: ["service", "price_dollars", "reasoning"],
  },
};

// Deterministic stand-in for local dev without ANTHROPIC_API_KEY — same
// shape as the real call, swapped automatically once a key is set.
function mockOfferProposal(niche: string): OfferProposal {
  const n = niche.toLowerCase();
  if (n.includes("voice receptionist") || n.includes("home service")) {
    return {
      service: "AI Missed-Call Recovery System",
      priceCents: 200000,
      reasoning:
        "A one-time setup fee with a 50% deposit means signing alone crosses your $1,000 milestone.",
    };
  }
  if (n.includes("real estate") || n.includes("lead-qualification") || n.includes("lead qualification")) {
    return {
      service: "AI Lead Qualification Chatbot",
      priceCents: 220000,
      reasoning:
        "Agents already budget for lead tools, and this price supports a deposit that alone clears $1,000.",
    };
  }
  if (n.includes("content repurposing") || n.includes("coach")) {
    return {
      service: "AI Content Repurposing Package",
      priceCents: 200000,
      reasoning:
        "A one-time setup fee with a 50% deposit means signing alone crosses your $1,000 milestone.",
    };
  }
  return {
    service: `AI Automation Package for ${niche}`,
    priceCents: 200000,
    reasoning:
      "A fixed price with a 50% deposit means one signed client reaches your $1,000 milestone at signing.",
  };
}

export async function getOfferProposal(niche: string): Promise<OfferProposal> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[offer] ANTHROPIC_API_KEY not set — using mock offer proposal.");
    return mockOfferProposal(niche);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system: [{ type: "text", text: systemPrompt(niche), cache_control: { type: "ephemeral" } }],
    tools: [OFFER_TOOL],
    tool_choice: { type: "tool", name: "propose_offer" },
    messages: [{ role: "user", content: "Propose my offer." }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  const input = toolUse?.input as { service: string; price_dollars: number; reasoning: string };
  return {
    service: input.service,
    priceCents: Math.round(input.price_dollars * 100),
    reasoning: input.reasoning,
  };
}
