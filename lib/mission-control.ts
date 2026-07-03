import type {
  Agency,
  Client,
  Lead,
  Milestone,
  Website,
} from "@/generated/prisma/client";

export type AgencyWithRelations = Agency & {
  website: Website | null;
  leads: Lead[];
  clients: Client[];
  milestones: Milestone[];
};

export type MissionControlState = {
  sentence: string;
  reasoning: string;
  actionLabel: string;
  // Undefined means this state's flow isn't built yet — the button renders
  // disabled rather than silently doing nothing on click.
  actionHref?: string;
};

function hasMilestone(agency: AgencyWithRelations, key: string) {
  return agency.milestones.some((m) => m.key === key);
}

function isChecklistComplete(client: Client) {
  if (!client.deliveryChecklistJson) return false;
  try {
    const items = JSON.parse(client.deliveryChecklistJson) as { done: boolean }[];
    return items.length > 0 && items.every((i) => i.done);
  } catch {
    return false;
  }
}

/**
 * The state machine from 00_V1_PRODUCT_SPEC.md §3 — evaluated top to bottom,
 * first match wins. The $1,000 celebration is deliberately NOT a branch here;
 * it's checked independently and fires as a one-time interstitial (see the
 * spec's note on why 8/9 aren't strictly sequential). That overlay isn't
 * built in this pass — this function only computes the persistent card.
 */
export function computeMissionControlState(
  agency: AgencyWithRelations
): MissionControlState {
  if (!agency.nicheLockedAt) {
    return {
      sentence: "Let's find your agency's focus.",
      reasoning:
        "A specific, well-chosen niche is the single biggest lever for how fast you reach your first client.",
      actionLabel: "Get Started",
      actionHref: "/onboarding",
    };
  }

  if (!agency.offerLockedAt) {
    return {
      sentence: "Let's define what you sell.",
      reasoning:
        "A clear, priced offer is what turns your niche into something a stranger can actually say yes to.",
      actionLabel: "Define My Offer",
    };
  }

  if (!agency.brandLockedAt) {
    return {
      sentence: "Let's build your brand.",
      reasoning:
        "Your name and positioning need to exist before we build a website around them.",
      actionLabel: "Build My Brand",
    };
  }

  if (!agency.website) {
    return {
      sentence: "Let's build your website.",
      reasoning:
        "This is the first thing a real prospect checks to know you're real.",
      actionLabel: "Build My Website",
    };
  }

  if (agency.website.status !== "published") {
    return {
      sentence: "Let's get you live.",
      reasoning: "Your site is ready — going live is what makes you findable.",
      actionLabel: "Go Live",
    };
  }

  const contactedLeads = agency.leads.filter((l) => l.status !== "new");
  if (contactedLeads.length === 0) {
    return {
      sentence: "Let's find your first client.",
      reasoning:
        "No outreach means no clients, no matter how good your offer and site are.",
      actionLabel: "Start Outreach",
    };
  }

  const callBooked = hasMilestone(agency, "first_call_booked");
  if (!callBooked) {
    return {
      sentence: `Follow up — you have ${contactedLeads.length} lead${contactedLeads.length === 1 ? "" : "s"} waiting.`,
      reasoning:
        "Most replies come from a second or third touch, not the first message.",
      actionLabel: "Follow Up",
    };
  }

  const signedClient = agency.clients[0];
  if (!signedClient) {
    return {
      sentence: "Prep for your call.",
      reasoning: "A booked call is real demand — let's make sure you close it.",
      actionLabel: "Prep For Call",
    };
  }

  if (!isChecklistComplete(signedClient)) {
    return {
      sentence: `Let's deliver ${signedClient.leadId ? "your client's" : "the"} project.`,
      reasoning:
        "A great delivery is what turns this client into a testimonial and a referral.",
      actionLabel: "Continue Delivery",
    };
  }

  if (!signedClient.testimonialRequestedAt) {
    return {
      sentence: "Ask your client for a testimonial.",
      reasoning: "The best time to ask is right now, while the win is still fresh.",
      actionLabel: "Ask For Testimonial",
    };
  }

  return {
    sentence: "You've done it — this is the whole V1 journey.",
    reasoning: "Scale unlocks here later. For now, this is the finish line.",
    actionLabel: "Coming Soon",
  };
}
