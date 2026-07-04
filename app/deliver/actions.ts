"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  getStatusUpdate,
  buildStatusUpdatePrompt,
  type ChecklistItem,
} from "@/lib/ai/delivery";
import { getTestimonialAsk, buildTestimonialPrompt } from "@/lib/ai/testimonial";

// Dev mode: persist a hand-pasted checklist generation, then the page
// re-renders with the real record — identical to the live flow after that.
export async function saveDevChecklist(clientId: string, checklist: ChecklistItem[]) {
  await prisma.client.update({
    where: { id: clientId },
    data: {
      deliveryChecklistJson: JSON.stringify(checklist),
      projectStatus: "in_progress",
    },
  });
  revalidatePath("/deliver");
  revalidatePath("/");
}

// Dev mode: prompts built server-side from current DB state (the playbook is
// read from the filesystem, and the status update needs the live checklist).
export async function getStatusUpdateDevPrompt(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { lead: true, agency: true },
  });
  const checklist = JSON.parse(client.deliveryChecklistJson ?? "[]") as ChecklistItem[];
  return buildStatusUpdatePrompt(
    client.lead?.name ?? "there",
    client.agency.brandName ?? "Us",
    checklist
  );
}

export async function getTestimonialDevPrompt(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { lead: true, agency: true },
  });
  return buildTestimonialPrompt(client.lead?.name ?? "there", client.agency.brandName ?? "Us");
}

export async function toggleChecklistItem(clientId: string, index: number) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });
  const checklist = JSON.parse(client.deliveryChecklistJson ?? "[]") as ChecklistItem[];
  checklist[index] = { ...checklist[index], done: !checklist[index].done };
  const allDone = checklist.every((i) => i.done);

  await prisma.client.update({
    where: { id: clientId },
    data: {
      deliveryChecklistJson: JSON.stringify(checklist),
      projectStatus: allDone ? "delivered" : "in_progress",
    },
  });

  revalidatePath("/deliver");
  revalidatePath("/");
}

export async function draftStatusUpdateForClient(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { lead: true, agency: true },
  });
  const checklist = JSON.parse(client.deliveryChecklistJson ?? "[]") as ChecklistItem[];
  return getStatusUpdate(
    client.lead?.name ?? "there",
    client.agency.brandName ?? "Us",
    checklist
  );
}

export async function draftTestimonialAskForClient(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { lead: true, agency: true },
  });
  return getTestimonialAsk(client.lead?.name ?? "there", client.agency.brandName ?? "Us");
}

export async function markTestimonialRequested(clientId: string) {
  await prisma.client.update({
    where: { id: clientId },
    data: { testimonialRequestedAt: new Date() },
  });
  redirect("/");
}
