"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getStatusUpdate, type ChecklistItem } from "@/lib/ai/delivery";
import { getTestimonialAsk } from "@/lib/ai/testimonial";

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
