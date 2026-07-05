import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";
import { extractJson } from "./dev-mode";

export type ProspectStrategy = {
  lookFor: string[];  // ✅ signals of a qualified prospect
  skip: string[];     // ❌ signals to disqualify immediately
};

export type ProspectCandidate = {
  name: string;
  verdict: "keep" | "check" | "skip";
  coaching: string; // 2-4 sentences: what they spotted, what they missed, how to think about this business
};

export type ProspectEvaluation = {
  candidates: ProspectCandidate[];
  summary: string; // the pattern across all their picks — what mental model they're developing
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
  return `You are Omnio — an experienced AI agency owner coaching a first-time founder who is targeting "${niche}" with offer: "${service}".

Your role here is mentor, not judge. The founder has found their first few candidate businesses. Your job is to coach their thinking so that by prospect 25, they no longer need you to tell them which businesses are good. They should have internalized the pattern themselves.

A qualified prospect passes all four tests:
1. The pain is expensive — they're actively losing money or customers to the problem your offer solves
2. The owner feels it — they already know something is wrong; you're not educating them that a problem exists
3. The offer solves it — "${service}" specifically addresses what they're losing
4. They can actually buy — owner-operated, established, decision-maker on the call

The niche-specific signals for "${niche}":
✅ Look for:${strategy.lookFor.map((s) => `\n- ${s}`).join("")}
❌ Skip:${strategy.skip.map((s) => `\n- ${s}`).join("")}

For each candidate, write 2–4 sentences of coaching:
- Acknowledge what their description reveals they spotted (reference what they wrote)
- Point out what an experienced owner would also notice that they didn't mention
- Explain how to think about this business using the four-test framework above
- Give a clear verdict: keep, check (worth a look but verify one thing first), or skip

Do NOT be formulaic. Don't write "You noticed X. You missed Y. Therefore Z." every time. Write like a mentor who has seen a hundred of these businesses and is genuinely helping someone develop their instincts.

The summary should name the pattern across all their picks — what mental model they're building, and whether it's calibrated correctly. Not a score. A diagnosis.

Candidates they found:
${candidates}

---

Respond with ONLY a JSON object in exactly this shape, nothing else:
{
  "candidates": [
    {
      "name": "business name as they wrote it",
      "verdict": "keep | check | skip",
      "coaching": "2-4 sentences of genuine coaching — reference what they noticed, what they missed, how an experienced owner thinks about this specific business"
    }
  ],
  "summary": "2-3 sentences naming the pattern across their picks — what instinct they're developing and whether it's on track. End with a concrete next step or encouragement."
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
  description: "Call this with coaching feedback for each candidate and a pattern summary.",
  input_schema: {
    type: "object",
    properties: {
      candidates: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            verdict: { type: "string", enum: ["keep", "check", "skip"] },
            coaching: {
              type: "string",
              description:
                "2-4 sentences coaching the founder's thinking: what they spotted, what they missed, how to think about this business.",
            },
          },
          required: ["name", "verdict", "coaching"],
        },
      },
      summary: {
        type: "string",
        description:
          "2-3 sentences naming the pattern across all their picks and whether their instincts are calibrated correctly.",
      },
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
  const verdicts: ProspectCandidate["verdict"][] = ["keep", "check", "skip"];
  const coachingExamples = [
    "You correctly noticed they're active — that matters. What your description doesn't mention is whether the phone number goes straight to the owner or to a menu. Call it yourself before you reach out. A business that answers calls directly is the whole game here; one that already has a phone system built out is a much harder sell. Based on what you've shared, I'd keep this one — just verify the phone.",
    "Your instinct to flag the reviews is right. 40 reviews for a home service company is the sweet spot: established enough to have budget, not so big they have a whole admin team handling inbound. The thing to look for next is whether those reviews mention responsiveness — 'called back immediately' or 'hard to reach' tells you exactly how much this pain costs them. Keep this one.",
    "The franchise flag is the right call, and it's worth understanding why so you can spot it faster next time. The issue isn't size — it's authority. A franchise owner can like your pitch and still not be able to sign a vendor agreement without corporate approval, which means your deal dies in a committee you'll never meet. Skip this one. The tell is usually a corporate website URL or a disclaimer in the footer.",
  ];
  return {
    candidates: lines.slice(0, 5).map((line, i) => ({
      name: line.trim(),
      verdict: verdicts[i % 3],
      coaching: coachingExamples[i % 3],
    })),
    summary:
      "You're developing the right instincts — you're looking at signals like reviews, phone presence, and business type, which is exactly the right layer. The one thing to sharpen: make sure every business you flag actually passes the 'owner feels the pain' test. You want businesses where a missed call is genuinely lost revenue, not just an inconvenience. Go build the rest of your 25 with that filter in mind.",
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
