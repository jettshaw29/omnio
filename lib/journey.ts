import { redirect } from "next/navigation";
import type {
  Agency,
  Client,
  Lead,
  Milestone,
  Website,
} from "@/generated/prisma/client";

export type ClientWithLead = Client & { lead: Lead | null };

export type AgencyWithRelations = Agency & {
  website: Website | null;
  leads: Lead[];
  clients: ClientWithLead[];
  milestones: Milestone[];
};

export type StageKey =
  | "niche"
  | "offer"
  | "brand"
  | "website"
  | "launch"
  | "prospect"
  | "outreach"
  | "follow_up"
  | "prep_call"
  | "deliver"
  | "testimonial"
  | "scale";

export type MissionControlState = {
  sentence: string;
  reasoning: string;
  actionLabel: string;
  actionHref?: string;
};

type Stage = {
  key: StageKey;
  route: string | null;
  sentence: string | ((agency: AgencyWithRelations) => string);
  reasoning: string;
  actionLabel: string;
  isComplete: (agency: AgencyWithRelations) => boolean;
  /**
   * True for the sequential Build-phase setup steps that have no real
   * milestone or decision in between them — completing one should chain
   * straight into the next screen rather than bouncing through Mission
   * Control just to click one more button. False everywhere a genuine
   * milestone or a "what's actually next might differ" moment exists, where
   * returning to Mission Control is the right call (00_V1_PRODUCT_SPEC.md §3
   * on why milestones don't just chain sequentially).
   */
  autoAdvance: boolean;
};

function hasMilestone(agency: AgencyWithRelations, key: string): boolean {
  return agency.milestones.some((m) => m.key === key);
}

function isChecklistComplete(client: ClientWithLead | undefined): boolean {
  if (!client?.deliveryChecklistJson) return false;
  try {
    const items = JSON.parse(client.deliveryChecklistJson) as { done: boolean }[];
    return items.length > 0 && items.every((i) => i.done);
  } catch {
    return false;
  }
}

/**
 * The Journey Engine — the single ordered definition of the V1 path
 * (00_V1_PRODUCT_SPEC.md §3, 04_FIRST_1000_BLUEPRINT.md). This array is now
 * the one place stage order, prerequisites, and Mission Control's copy all
 * live. Every page's access guard and Mission Control's card are both
 * derived from it, so they cannot silently drift out of sync with each
 * other the way duplicated ad hoc checks could.
 */
export const STAGES: Stage[] = [
  {
    key: "niche",
    route: "/onboarding",
    sentence: "Let's find your agency's focus.",
    reasoning:
      "A specific, well-chosen niche is the single biggest lever for how fast you reach your first client.",
    actionLabel: "Get Started",
    isComplete: (a) => !!a.nicheLockedAt,
    autoAdvance: true,
  },
  {
    key: "offer",
    route: "/offer",
    sentence: "Let's define what you sell.",
    reasoning:
      "A clear, priced offer is what turns your niche into something a stranger can actually say yes to.",
    actionLabel: "Define My Offer",
    isComplete: (a) => !!a.offerLockedAt,
    autoAdvance: true,
  },
  {
    key: "brand",
    route: "/brand",
    sentence: "Let's build your brand.",
    reasoning:
      "Your name and positioning need to exist before we build a website around them.",
    actionLabel: "Build My Brand",
    isComplete: (a) => !!a.brandLockedAt,
    autoAdvance: true,
  },
  {
    key: "website",
    route: "/website",
    sentence: "Let's build your website.",
    reasoning: "This is the first thing a real prospect checks to know you're real.",
    actionLabel: "Build My Website",
    isComplete: (a) => !!a.website,
    // Drafting and publishing happen in the same visit to /website — there's
    // no separate screen to advance to.
    autoAdvance: false,
  },
  {
    key: "launch",
    route: "/website",
    sentence: "Let's get you live.",
    reasoning: "Your site is ready — going live is what makes you findable.",
    actionLabel: "Go Live",
    isComplete: (a) => a.website?.status === "published",
    // A real milestone — return to Mission Control rather than chaining,
    // since the next phase (finding clients) is different in kind, not just
    // the next form in a sequence.
    autoAdvance: false,
  },
  {
    key: "prospect",
    route: "/prospect",
    sentence: "Build a list of 25 qualified prospects.",
    reasoning:
      "Not all businesses are worth contacting. Omnio will teach you exactly what a qualified prospect looks like for your niche — then review your first few picks before you build the full list.",
    actionLabel: "Build My List",
    isComplete: (a) => !!a.prospectEvaluatedAt,
    autoAdvance: false,
  },
  {
    key: "outreach",
    route: "/leads",
    sentence: "Write and send your first outreach messages.",
    reasoning:
      "You have a list. Now Omnio writes the message — you just personalize the opener and hit send.",
    actionLabel: "Start Outreach",
    isComplete: (a) => a.leads.some((l) => l.status !== "new"),
    autoAdvance: false,
  },
  {
    key: "follow_up",
    route: "/leads",
    sentence: (a) => {
      const n = a.leads.filter((l) => l.status !== "new").length;
      return `You have ${n} lead${n === 1 ? "" : "s"} out — follow up.`;
    },
    reasoning:
      "Most replies don't come from the first message. Omnio will draft your follow-up so you don't have to guess what to say.",
    actionLabel: "Follow Up",
    isComplete: (a) => hasMilestone(a, "first_call_booked"),
    autoAdvance: false,
  },
  {
    key: "prep_call",
    route: "/leads",
    sentence: "You have a call booked — let's prepare.",
    reasoning:
      "A booked call is real demand. Omnio will give you the exact questions to ask and objections to expect.",
    actionLabel: "Prep For My Call",
    isComplete: (a) => a.clients.length > 0,
    autoAdvance: false,
  },
  {
    key: "deliver",
    route: "/deliver",
    sentence: (a) => `Let's deliver ${a.clients[0]?.leadId ? "your client's" : "the"} project.`,
    reasoning:
      "A great delivery is what turns this client into a testimonial and a referral.",
    actionLabel: "Continue Delivery",
    isComplete: (a) => isChecklistComplete(a.clients[0]),
    autoAdvance: false,
  },
  {
    key: "testimonial",
    route: "/deliver",
    sentence: "Ask your client for a testimonial.",
    reasoning: "The best time to ask is right now, while the win is still fresh.",
    actionLabel: "Ask For Testimonial",
    isComplete: (a) => !!a.clients[0]?.testimonialRequestedAt,
    autoAdvance: false,
  },
  {
    key: "scale",
    route: null,
    sentence: "You've done it — this is the whole V1 journey.",
    reasoning: "Scale unlocks here later. For now, this is the finish line.",
    actionLabel: "Coming Soon",
    isComplete: () => false, // the locked finish line, not a step that completes
    autoAdvance: false,
  },
];

function stageIndex(key: StageKey): number {
  const idx = STAGES.findIndex((s) => s.key === key);
  if (idx === -1) throw new Error(`Unknown stage key: ${key}`);
  return idx;
}

/** The current stage — the first one in order that isn't complete yet. */
export function getCurrentStage(agency: AgencyWithRelations): Stage {
  return STAGES.find((s) => !s.isComplete(agency)) ?? STAGES[STAGES.length - 1];
}

/** Mission Control's card, derived entirely from the current stage. */
export function computeMissionControlState(agency: AgencyWithRelations): MissionControlState {
  const stage = getCurrentStage(agency);
  return {
    sentence: typeof stage.sentence === "function" ? stage.sentence(agency) : stage.sentence,
    reasoning: stage.reasoning,
    actionLabel: stage.actionLabel,
    actionHref: stage.route ?? undefined,
  };
}

/**
 * Whether the user is allowed on this stage's route right now — true once
 * every stage before it is complete, regardless of whether this stage
 * itself is done yet. That's deliberate: it's what keeps already-completed
 * steps revisitable and editable (Article V — the AI proposes, the human
 * can still change their mind) instead of locking the door behind you.
 */
export function canAccessStage(agency: AgencyWithRelations, key: StageKey): boolean {
  const idx = stageIndex(key);
  return STAGES.slice(0, idx).every((s) => s.isComplete(agency));
}

/**
 * The route guard every guided screen calls. Centralizing this is the whole
 * point — one prerequisite definition instead of a slightly-different
 * hand-written check per page that could quietly drift out of sync.
 */
export function requireStageAccess(agency: AgencyWithRelations, key: StageKey): void {
  if (!canAccessStage(agency, key)) {
    redirect("/");
  }
}

/**
 * Where a stage's own action should send the user next. Auto-advancing
 * stages skip Mission Control entirely and go straight to the next screen;
 * everything else returns home, where Mission Control decides what's
 * actually next — which may not even be the "next" stage in this list (a
 * milestone can jump straight to a celebration instead).
 */
export function getRouteAfter(key: StageKey): string {
  const idx = stageIndex(key);
  const stage = STAGES[idx];
  if (!stage.autoAdvance) return "/";
  const next = STAGES[idx + 1];
  return next?.route ?? "/";
}
