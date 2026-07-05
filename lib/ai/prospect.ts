import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";
import { extractJson } from "./dev-mode";

export type ProspectStrategy = {
  lookFor: string[];  // ✅ signals of a qualified prospect
  skip: string[];     // ❌ signals to disqualify immediately
};

export type ProspectCandidate = {
  name: string;
  verdict: "good" | "check" | "skip";
  reason: string;
};

export type ProspectEvaluation = {
  candidates: ProspectCandidate[];
  summary: string; // one sentence overall — encouragement or course-correction
};

// ─── Strategy prompt ────────────────────────────────────────────────────────

const strategySystemPrompt = (niche: string, service: string) =>
  `You are Omnio, an experienced AI agency owner coaching a first-time founder who is targeting "${niche}".

${getPlaybook()}

Your job is to explain — very specifically, for this exact niche — what makes a business a qualified prospect vs one to skip. This is about teaching them to think like an agency owner, not giving them a generic checklist. Reference §2 (Identifying Ideal Clients) and §10 (Outreach) of the Playbook.

Be concrete. Not "look for established businesses" — say what establishment actually looks like for this niche. Not "skip bad fits" — say the observable signals that make a specific business in this niche a waste of time.`;

export function buildProspectPrompt(niche: string, service: string, brandName: string): string {
  return `${strategySystemPrompt(niche, service)}

Agency: "${brandName}". Niche: "${niche}". Offer: "${service}".

---

Respond with ONLY a JSON object in exactly this shape, nothing else:
{
  "lookFor": [
    "specific, observable signal that this business is worth contacting — write it as if you are pointing at something they will actually see (a website, a review count, a phone number)"
  ],
  "skip": [
    "specific, observable signal that this business is a waste of time — something they would notice in 30 seconds of looking"
  ]
}

Aim for 4-6 items in each list. Specific beats exhaustive.`;
}

export function parseProspectResponse(raw: string): ProspectStrategy {
  return extractJson<ProspectStrategy>(raw);
}

// ─── Evaluation prompt ───────────────────────────────────────────────────────

export function buildEvalPrompt(
  candidates: string,
  niche: string,
  service: string,
  strategy: ProspectStrategy
): string {
  return `You are Omnio, an experienced AI agency owner reviewing prospect picks made by a first-time founder targeting "${niche}" with offer: "${service}".

The qualified-prospect criteria for this niche:
✅ Look for: ${strategy.lookFor.map((s) => `\n- ${s}`).join("")}
❌ Skip: ${strategy.skip.map((s) => `\n- ${s}`).join("")}

The founder has pasted their first few candidate businesses. Review each one honestly:
- "good": strong fit, worth reaching out to
- "check": might be okay but has at least one concern worth noting
- "skip": clear disqualifier

Be direct. One sentence per prospect. The summary should either reinforce their instincts or gently correct their filter — not both.

Candidates they found:
${candidates}

---

Respond with ONLY a JSON object in exactly this shape, nothing else:
{
  "candidates": [
    { "name": "business name as they wrote it", "verdict": "good | check | skip", "reason": "one direct sentence — why" }
  ],
  "summary": "one sentence — overall verdict on their ICP instincts, e.g. 'You're picking the right kind of business — go find the other 20.' or 'Your list has a pattern: you're drawn to bigger companies than this offer is built for. Let's recalibrate.'"
}`;
}

export function parseEvalResponse(raw: string): ProspectEvaluation {
  return extractJson<ProspectEvaluation>(raw);
}

// ─── Live API calls ──────────────────────────────────────────────────────────

const STRATEGY_TOOL: Anthropic.Tool = {
  name: "build_prospect_criteria",
  description: "Call this with the qualified-prospect criteria specific to the user's niche.",
  input_schema: {
    type: "object",
    properties: {
      lookFor: {
        type: "array",
        items: { type: "string" },
        description: "Observable signals that indicate a qualified prospect.",
      },
      skip: {
        type: "array",
        items: { type: "string" },
        description: "Observable signals that indicate a prospect to skip.",
      },
    },
    required: ["lookFor", "skip"],
  },
};

const EVAL_TOOL: Anthropic.Tool = {
  name: "evaluate_prospects",
  description: "Call this with verdicts for each candidate and an overall summary.",
  input_schema: {
    type: "object",
    properties: {
      candidates: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            verdict: { type: "string", enum: ["good", "check", "skip"] },
            reason: { type: "string" },
          },
          required: ["name", "verdict", "reason"],
        },
      },
      summary: { type: "string" },
    },
    required: ["candidates", "summary"],
  },
};

function mockStrategy(niche: string): ProspectStrategy {
  return {
    lookFor: [
      `Owner-operated ${niche} business with a working phone number listed on Google — they live and die by incoming calls`,
      "Active Google Business Profile with 15–100 reviews — established enough to pay, not so big they have a receptionist already",
      "Website exists but hasn't been updated in 1–3 years — they care about their business but haven't solved the tech problem",
      "Recently ran a Google or Facebook ad — signals they're trying to grow and have budget",
      "No 'press 1 for sales, press 2 for service' menu when you call — they're answering manually",
    ],
    skip: [
      "National or regional franchise location — the owner can't say yes to a new vendor without corporate approval",
      "Fewer than 10 Google reviews or listing created in the last 6 months — too new, likely no budget",
      "Already using a call-center service or has a dedicated receptionist (visible in their job listings or website footer)",
      "1-star average with angry customer responses — they have operational problems that AI won't fix",
      "Business phone goes to a generic voicemail with no callback promise — they've already given up on call management",
    ],
  };
}

function mockEvaluation(candidatesRaw: string): ProspectEvaluation {
  const lines = candidatesRaw.split("\n").filter((l) => l.trim());
  return {
    candidates: lines.slice(0, 5).map((line, i) => ({
      name: line.trim(),
      verdict: i % 3 === 2 ? "skip" : i % 3 === 1 ? "check" : "good",
      reason:
        i % 3 === 2
          ? "Franchise location — the owner can't approve a new vendor without corporate."
          : i % 3 === 1
            ? "Looks established but their Google listing shows a dedicated front desk — confirm before outreach."
            : "Owner-operated, phone-reliant, established reviews. Strong fit.",
    })),
    summary:
      "You're finding the right shape of business. Go build out the rest of your 25.",
  };
}

export async function buildProspectStrategy(
  niche: string,
  service: string,
  brandName: string
): Promise<ProspectStrategy> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[prospect] ANTHROPIC_API_KEY not set — using mock strategy.");
    return mockStrategy(niche);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: strategySystemPrompt(niche, service),
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [STRATEGY_TOOL],
    tool_choice: { type: "tool", name: "build_prospect_criteria" },
    messages: [
      {
        role: "user",
        content: `Build prospect criteria for "${brandName}" targeting "${niche}" with offer: "${service}".`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  return toolUse?.input as ProspectStrategy;
}

export async function evaluateProspects(
  candidates: string,
  niche: string,
  service: string,
  strategy: ProspectStrategy
): Promise<ProspectEvaluation> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[prospect] ANTHROPIC_API_KEY not set — using mock evaluation.");
    return mockEvaluation(candidates);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    tools: [EVAL_TOOL],
    tool_choice: { type: "tool", name: "evaluate_prospects" },
    messages: [
      { role: "user", content: buildEvalPrompt(candidates, niche, service, strategy) },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  return toolUse?.input as ProspectEvaluation;
}
