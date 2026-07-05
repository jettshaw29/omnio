import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";
import { extractJson } from "./dev-mode";

export type ProspectStrategy = {
  whereToLook: string[];    // platforms/sources to find prospects
  whatToSearch: string[];   // exact search queries or methods
  qualifyingSignals: string[]; // signs they're a good fit
  redFlags: string[];          // who to skip
};

const systemPrompt = (niche: string, service: string) => `You are Omnio, an experienced AI agency owner who has personally done cold outreach for agencies targeting "${niche}".

${getPlaybook()}

Your job is to give a first-time agency owner a specific, actionable prospect research strategy for finding their first 25 leads. Focus entirely on "${niche}" businesses. Reference §10 of the Playbook for outreach principles.

Be concrete. Not "search LinkedIn" — say exactly what to search for. Not "look for businesses" — say exactly where they live online and what signals show they're ready to buy. Think like a scout, not a consultant.`;

export function buildProspectPrompt(niche: string, service: string, brandName: string): string {
  return `${systemPrompt(niche, service)}

Agency: "${brandName}". Niche: "${niche}". Offer: "${service}".

---

Respond with ONLY a JSON object in exactly this shape, nothing else:
{
  "whereToLook": ["platform or source — be specific (e.g. 'Google Maps search for [city] HVAC contractor')"],
  "whatToSearch": ["exact search string or method — copy-paste ready"],
  "qualifyingSignals": ["what tells you they're a good prospect — observable, not generic"],
  "redFlags": ["what tells you to skip them — observable, not generic"]
}`;
}

export function parseProspectResponse(raw: string): ProspectStrategy {
  return extractJson<ProspectStrategy>(raw);
}

const PROSPECT_TOOL: Anthropic.Tool = {
  name: "build_prospect_strategy",
  description: "Call this once with the prospect research strategy for finding the first 25 leads.",
  input_schema: {
    type: "object",
    properties: {
      whereToLook: {
        type: "array",
        items: { type: "string" },
        description: "Specific platforms and sources where these prospects can be found.",
      },
      whatToSearch: {
        type: "array",
        items: { type: "string" },
        description: "Exact search strings or methods, ready to copy and use.",
      },
      qualifyingSignals: {
        type: "array",
        items: { type: "string" },
        description: "Observable signals that indicate a good prospect.",
      },
      redFlags: {
        type: "array",
        items: { type: "string" },
        description: "Observable signals that indicate a prospect to skip.",
      },
    },
    required: ["whereToLook", "whatToSearch", "qualifyingSignals", "redFlags"],
  },
};

function mockProspectStrategy(niche: string): ProspectStrategy {
  return {
    whereToLook: [
      `Google Maps: search "[city] ${niche}" — every business with fewer than 50 reviews is a target`,
      "Yelp Business Directory filtered by your city and category",
      "Angi (formerly Angie's List) — contractor listings with contact info visible",
      "Facebook Business Pages in local service groups",
    ],
    whatToSearch: [
      `"${niche} [your city]" on Google Maps — sort by newest reviews`,
      `"${niche} near me" — grab the ones on page 2-3 of results (visible but not dominant)`,
      `Facebook: search "${niche} [city]" in Groups → filter by Pages`,
      "Yelp: category filter → sort by 'Newest' to find active businesses",
    ],
    qualifyingSignals: [
      "Has a working phone number listed (they rely on calls)",
      "Fewer than 50 Google reviews but actively responding to the ones they have",
      "Website exists but looks more than 2 years old or has no contact form",
      "Active on Facebook but posts are inconsistent (they want systems, not more manual work)",
    ],
    redFlags: [
      "Franchise location — they can't make buying decisions",
      "Solo owner with 1-star reviews and no responses (not a buyer mindset)",
      "Already advertising heavily on Google — they have marketing covered",
      "No web presence at all — not yet ready for AI systems",
    ],
  };
}

export async function buildProspectStrategy(
  niche: string,
  service: string,
  brandName: string
): Promise<ProspectStrategy> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[prospect] ANTHROPIC_API_KEY not set — using mock strategy.");
    return mockProspectStrategy(niche);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: [
      { type: "text", text: systemPrompt(niche, service), cache_control: { type: "ephemeral" } },
    ],
    tools: [PROSPECT_TOOL],
    tool_choice: { type: "tool", name: "build_prospect_strategy" },
    messages: [
      {
        role: "user",
        content: `Build a prospect research strategy for "${brandName}" targeting "${niche}" with offer: "${service}".`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  return toolUse?.input as ProspectStrategy;
}
