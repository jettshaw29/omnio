import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";

// Playbook §18-19: ask for both in the same moment, right after the win,
// while it's freshest — not as two separate asks later.
const systemPrompt = (leadName: string, brandName: string) => `You are Omnio, an experienced, calm agency owner. Full expertise below.

${getPlaybook()}

Draft a short message to ${leadName} from ${brandName}, asking for a testimonial and a referral in the same message, right after a successful delivery — following Playbook §18 (a specific guided question, not "could you leave a review") and §19 (a specific, easy referral ask, not "know anyone who needs this?"). Warm, brief, not transactional.`;

const TESTIMONIAL_TOOL: Anthropic.Tool = {
  name: "draft_testimonial_ask",
  description: "Call this once with the drafted message.",
  input_schema: {
    type: "object",
    properties: { message: { type: "string" } },
    required: ["message"],
  },
};

function mockTestimonialAsk(leadName: string, brandName: string): string {
  const first = leadName.split(" ")[0];
  return `Hi ${first},

Really glad this is live and working for you. Two quick asks while it's fresh:

1. What result surprised you most so far? Even a sentence helps other business owners like you trust this is real.
2. Do you know another business owner who's dealing with the same problem you were? A quick intro would mean a lot.

Thanks again for taking a chance on ${brandName}.`;
}

export async function getTestimonialAsk(
  leadName: string,
  brandName: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[testimonial] ANTHROPIC_API_KEY not set — using mock testimonial ask.");
    return mockTestimonialAsk(leadName, brandName);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 384,
    system: [
      { type: "text", text: systemPrompt(leadName, brandName), cache_control: { type: "ephemeral" } },
    ],
    tools: [TESTIMONIAL_TOOL],
    tool_choice: { type: "tool", name: "draft_testimonial_ask" },
    messages: [{ role: "user", content: "Draft the message." }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  const input = toolUse?.input as { message: string };
  return input.message;
}
