import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";
import { extractJson } from "./dev-mode";

export type OutreachContext = {
  niche: string;
  service: string;
  brandName: string;
  positioning: string;
};

const systemPrompt = (ctx: OutreachContext) => `You are Omnio, an experienced, calm agency owner. Full expertise below.

${getPlaybook()}

Draft ONE cold outreach message using Playbook §10's structure: a specific, personalized opener about their business, the specific problem, the solution in one line with a concrete benefit, a low-friction call to action. No links or attachments (spam triggers). Keep it short — a few sentences.

Agency: "${ctx.brandName}" (${ctx.positioning}). Niche: "${ctx.niche}". Offer: "${ctx.service}".

Never draft anything that pretends to already know the recipient personally — reference only their business/industry, since that's all that's actually known.`;

// Dev-mode prompt + parser (see offer.ts). The message can be many lines, so
// wrapping it in JSON (rather than taking the paste raw) keeps the parse
// unambiguous even if Claude adds a "Here's the message:" preamble.
export function buildOutreachPrompt(
  leadName: string,
  leadBusiness: string,
  ctx: OutreachContext
): string {
  return `${systemPrompt(ctx)}

Draft outreach for ${leadName} at ${leadBusiness}.

---

Respond with ONLY a JSON object in exactly this shape, nothing else:
{
  "message": "the full outreach message, ready to copy and send"
}`;
}

export function parseOutreachResponse(raw: string): string {
  return extractJson<{ message: string }>(raw).message;
}

const OUTREACH_TOOL: Anthropic.Tool = {
  name: "draft_outreach",
  description: "Call this once with the drafted outreach message.",
  input_schema: {
    type: "object",
    properties: {
      message: { type: "string", description: "The full outreach message, ready to copy and send." },
    },
    required: ["message"],
  },
};

function mockOutreach(leadName: string, leadBusiness: string, ctx: OutreachContext): string {
  return `Hi ${leadName.split(" ")[0]},

I help businesses like ${leadBusiness} avoid losing customers to ${ctx.niche.toLowerCase().includes("call") ? "missed calls" : "slow follow-up"}, using your own ${ctx.service} — most owners don't realize how much that's actually costing them until they see the number.

Worth a quick 10-minute call to see if it's a fit?

${ctx.brandName}`;
}

const followUpSystemPrompt = (ctx: OutreachContext) => `You are Omnio, a calm and experienced agency owner helping a beginner follow up on cold outreach that got no reply.

Draft a SHORT follow-up message — 2 to 3 sentences, no more. Rules:
- Briefly acknowledge you reached out before, without apologising for it
- Try a different angle or a simpler question than the first message
- End with an easy yes/no question, not a big ask
- Never use phrases like "I hope this finds you well" or "just checking in"

Agency: "${ctx.brandName}". Niche: "${ctx.niche}". Offer: "${ctx.service}".`;

const FOLLOW_UP_TOOL: Anthropic.Tool = {
  name: "draft_follow_up",
  description: "Call this once with the drafted follow-up message.",
  input_schema: {
    type: "object",
    properties: {
      message: { type: "string", description: "The short follow-up, 2-3 sentences max." },
    },
    required: ["message"],
  },
};

function mockFollowUp(leadName: string, leadBusiness: string, ctx: OutreachContext): string {
  return `Hi ${leadName.split(" ")[0]}, following up on my note from a few days ago — is there a better time to connect about what this could look like for ${leadBusiness}?

${ctx.brandName}`;
}

export async function draftFollowUp(
  leadName: string,
  leadBusiness: string,
  ctx: OutreachContext
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return mockFollowUp(leadName, leadBusiness, ctx);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 256,
    system: [{ type: "text", text: followUpSystemPrompt(ctx), cache_control: { type: "ephemeral" } }],
    tools: [FOLLOW_UP_TOOL],
    tool_choice: { type: "tool", name: "draft_follow_up" },
    messages: [
      { role: "user", content: `Draft follow-up for ${leadName} at ${leadBusiness}.` },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  const input = toolUse?.input as { message: string };
  return input.message;
}

export async function draftOutreach(
  leadName: string,
  leadBusiness: string,
  ctx: OutreachContext
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[outreach] ANTHROPIC_API_KEY not set — using mock outreach draft.");
    return mockOutreach(leadName, leadBusiness, ctx);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system: [{ type: "text", text: systemPrompt(ctx), cache_control: { type: "ephemeral" } }],
    tools: [OUTREACH_TOOL],
    tool_choice: { type: "tool", name: "draft_outreach" },
    messages: [
      { role: "user", content: `Draft outreach for ${leadName} at ${leadBusiness}.` },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  const input = toolUse?.input as { message: string };
  return input.message;
}
