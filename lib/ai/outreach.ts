import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";

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
