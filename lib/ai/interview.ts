import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";
import { extractJson } from "./dev-mode";

export type InterviewMessage = { role: "user" | "assistant"; content: string };
export type NicheOption = { name: string; reasoning: string };
export type InterviewStep =
  | { kind: "question"; question: string }
  | { kind: "niches"; niches: NicheOption[] };

const SYSTEM_PROMPT = `You are Omnio, an experienced, calm agency owner helping a complete beginner choose the focus for their new AI agency. Full voice and expertise below — every recommendation must trace back to it.

${getPlaybook()}

You are running the Dream/Discover interview (01_MISSION_CONTROL_UX.md §3). Rules:
- Ask exactly ONE question at a time. No preamble, no numbering, no "question 1 of N" — there is no progress bar by design.
- Ask about skills, interests, existing relationships, budget, and available time — enough to apply the niche filters in the Playbook's §1.
- Once you have enough to recommend niches (usually after 2-4 questions), call propose_niches with 2-3 specific, beginner-viable niches, each with one concrete, specific line of reasoning grounded in the Playbook's filters. Do not call it before you have enough real signal.
- Never recommend "AI agency" itself as a niche — it must be specific (see Playbook §1).
- Tone: direct, warm, plain — never corporate, never hype (05_OMNIO_PERSONALITY.md).`;

// Dev-mode prompt + parser. Unlike the live path (which uses the message
// array + a tool), the whole conversation is rendered into one pasteable
// block, and Claude replies with a JSON envelope that's either a question or
// the niche proposals — mirroring the live tool-vs-text branch.
export function buildInterviewPrompt(history: InterviewMessage[]): string {
  const transcript =
    history.length === 0
      ? "(No questions asked yet — this is the very first turn.)"
      : history
          .map((m) => `${m.role === "assistant" ? "Omnio" : "User"}: ${m.content}`)
          .join("\n");

  return `${SYSTEM_PROMPT}

---

Conversation so far:
${transcript}

Decide your next move. If you still need more signal, ask ONE more question. If you have enough (usually after 2-4 questions), propose 2-3 specific niches instead.

Respond with ONLY ONE of these two JSON shapes, nothing else:

To ask a question:
{ "question": "your single next question" }

To propose niches:
{ "niches": [ { "name": "a specific niche", "reasoning": "one concrete sentence for this user" } ] }`;
}

export function parseInterviewResponse(raw: string): InterviewStep {
  const parsed = extractJson<{ question?: string; niches?: NicheOption[] }>(raw);
  if (parsed.niches && parsed.niches.length > 0) {
    return { kind: "niches", niches: parsed.niches };
  }
  if (parsed.question) {
    return { kind: "question", question: parsed.question };
  }
  throw new Error(
    'Expected JSON with either "question" or "niches". Paste Claude\'s full response.'
  );
}

const NICHE_TOOL: Anthropic.Tool = {
  name: "propose_niches",
  description:
    "Call this once, when you have enough information to recommend 2-3 specific AI-agency niches for this user.",
  input_schema: {
    type: "object",
    properties: {
      niches: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "A specific niche, e.g. 'AI voice receptionist for dental practices'" },
            reasoning: { type: "string", description: "One concrete sentence explaining why this fits this specific user." },
          },
          required: ["name", "reasoning"],
        },
      },
    },
    required: ["niches"],
  },
};

// Deterministic stand-in for local development without an Anthropic API key.
// Exercises the exact same UI/data flow as the real call — swap happens
// automatically the moment ANTHROPIC_API_KEY is set, nothing else changes.
const MOCK_QUESTIONS = [
  "What's something you already know a lot about — an industry, a job, a hobby?",
  "Roughly how many hours a week can you realistically put into this right now?",
];

function mockNextStep(history: InterviewMessage[]): InterviewStep {
  const answered = history.filter((m) => m.role === "user").length;
  if (answered < MOCK_QUESTIONS.length) {
    return { kind: "question", question: MOCK_QUESTIONS[answered] };
  }
  return {
    kind: "niches",
    niches: [
      {
        name: "AI voice receptionist for home services",
        reasoning:
          "A missed call is a missed job an owner already feels — one of the fastest, most visceral problems to pitch cold.",
      },
      {
        name: "AI lead-qualification chatbot for real estate",
        reasoning:
          "Agents already spend on lead gen and respond fast to demos, though positioning has to work harder since this niche is heavily pitched.",
      },
      {
        name: "AI content repurposing for coaches and creators",
        reasoning:
          "Coaches already produce raw video and feel the pain of not having time to turn it into weeks of social content.",
      },
    ],
  };
}

export async function getNextInterviewStep(
  history: InterviewMessage[]
): Promise<InterviewStep> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "[interview] ANTHROPIC_API_KEY not set — using mock interview responses."
    );
    return mockNextStep(history);
  }

  const client = new Anthropic();
  const mapped = history.map((m) => ({ role: m.role, content: m.content }));
  const messages = mapped.length > 0 ? mapped : [{ role: "user" as const, content: "Let's begin." }];
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    tools: [NICHE_TOOL],
    messages,
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (toolUse && toolUse.name === "propose_niches") {
    const input = toolUse.input as { niches: NicheOption[] };
    return { kind: "niches", niches: input.niches };
  }

  const text = response.content.find((b) => b.type === "text")?.text ?? "";
  return { kind: "question", question: text.trim() };
}
