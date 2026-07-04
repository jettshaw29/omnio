"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { draftOutreach, buildOutreachPrompt, type OutreachContext } from "@/lib/ai/outreach";

export async function addLead(agencyId: string, name: string, business: string) {
  await prisma.lead.create({ data: { agencyId, name, business } });
  revalidatePath("/leads");
}

// "new" is the only status that doesn't count as a real touchpoint — anything
// else updates lastContactAt. Reaching "call_booked" fires the milestone
// that advances Mission Control (00_V1_PRODUCT_SPEC.md §3).
export async function updateLeadStatus(leadId: string, status: string) {
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: { status, ...(status !== "new" ? { lastContactAt: new Date() } : {}) },
  });

  if (status === "call_booked") {
    await prisma.milestone.upsert({
      where: { agencyId_key: { agencyId: lead.agencyId, key: "first_call_booked" } },
      update: {},
      create: { agencyId: lead.agencyId, key: "first_call_booked" },
    });
  }

  revalidatePath("/leads");
  revalidatePath("/");
}

// AI never auto-sends (00_V1_PRODUCT_SPEC.md §4 trust boundary) — this only
// returns text for the user to copy and send themselves. There is no
// send_outreach action anywhere in this codebase, on purpose.
export async function draftOutreachForLead(leadId: string, ctx: OutreachContext) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  return draftOutreach(lead.name, lead.business, ctx);
}

// Dev mode: the exact prompt for this lead, built server-side (playbook is
// read from the filesystem).
export async function getOutreachDevPrompt(leadId: string, ctx: OutreachContext) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  return buildOutreachPrompt(lead.name, lead.business, ctx);
}
