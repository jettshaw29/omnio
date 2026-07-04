import Anthropic from "@anthropic-ai/sdk";
import { getPlaybook } from "./playbook";

export type ChecklistItem = { label: string; done: boolean };

const checklistSystemPrompt = (service: string) => `You are Omnio, an experienced, calm agency owner. Full expertise below.

${getPlaybook()}

Generate a delivery checklist for this specific service, using Playbook §16 (onboarding) and §17 (delivery). 5-7 concrete steps, in order, from kickoff to handover — e.g. gathering access/info, building/configuring, testing with real scenarios, client walkthrough, going live. Service: "${service}".`;

const CHECKLIST_TOOL: Anthropic.Tool = {
  name: "generate_checklist",
  description: "Call this once with the delivery checklist steps, in order.",
  input_schema: {
    type: "object",
    properties: {
      steps: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 7 },
    },
    required: ["steps"],
  },
};

function mockChecklist(service: string): ChecklistItem[] {
  return [
    "Kickoff call to confirm scope and timeline",
    `Collect access and info needed to build the ${service}`,
    "Configure and connect the system",
    "Test with real scenarios before handoff",
    "Walk the client through how to use and monitor it",
    "Go live and confirm it's working",
  ].map((label) => ({ label, done: false }));
}

export async function getDeliveryChecklist(service: string): Promise<ChecklistItem[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[delivery] ANTHROPIC_API_KEY not set — using mock checklist.");
    return mockChecklist(service);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system: [
      { type: "text", text: checklistSystemPrompt(service), cache_control: { type: "ephemeral" } },
    ],
    tools: [CHECKLIST_TOOL],
    tool_choice: { type: "tool", name: "generate_checklist" },
    messages: [{ role: "user", content: "Generate the checklist." }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  const input = toolUse?.input as { steps: string[] };
  return input.steps.map((label) => ({ label, done: false }));
}

// A client-facing progress update — proactive, per Playbook §17's "never go
// dark during delivery" rule. Copy-only, same trust boundary as outreach.
const statusUpdateSystemPrompt = (
  leadName: string,
  brandName: string,
  completedSteps: string[],
  remainingSteps: string[]
) => `You are Omnio, an experienced, calm agency owner. Full expertise below.

${getPlaybook()}

Draft a short, warm client status update for ${leadName} from ${brandName}, following Playbook §17's "never go dark" guidance. Completed so far: ${completedSteps.join("; ") || "just getting started"}. Still to do: ${remainingSteps.join("; ") || "nothing — almost done"}. Keep it brief, no jargon, confident.`;

const STATUS_UPDATE_TOOL: Anthropic.Tool = {
  name: "draft_status_update",
  description: "Call this once with the drafted status update message.",
  input_schema: {
    type: "object",
    properties: { message: { type: "string" } },
    required: ["message"],
  },
};

function mockStatusUpdate(
  leadName: string,
  brandName: string,
  completedSteps: string[],
  remainingSteps: string[]
): string {
  const first = leadName.split(" ")[0];
  const progress =
    remainingSteps.length === 0
      ? "everything is done and live"
      : `${completedSteps.length} of ${completedSteps.length + remainingSteps.length} steps are done`;
  return `Hi ${first},

Quick update: ${progress}. ${remainingSteps.length ? `Next up: ${remainingSteps[0]}.` : "I'll follow up shortly to walk you through it."}

${brandName}`;
}

export async function getStatusUpdate(
  leadName: string,
  brandName: string,
  checklist: ChecklistItem[]
): Promise<string> {
  const completedSteps = checklist.filter((i) => i.done).map((i) => i.label);
  const remainingSteps = checklist.filter((i) => !i.done).map((i) => i.label);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[delivery] ANTHROPIC_API_KEY not set — using mock status update.");
    return mockStatusUpdate(leadName, brandName, completedSteps, remainingSteps);
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 384,
    system: [
      {
        type: "text",
        text: statusUpdateSystemPrompt(leadName, brandName, completedSteps, remainingSteps),
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [STATUS_UPDATE_TOOL],
    tool_choice: { type: "tool", name: "draft_status_update" },
    messages: [{ role: "user", content: "Draft the update." }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  const input = toolUse?.input as { message: string };
  return input.message;
}
