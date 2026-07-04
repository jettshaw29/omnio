import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import {
  getDeliveryChecklist,
  buildChecklistPrompt,
  type ChecklistItem,
} from "@/lib/ai/delivery";
import { isAiDevMode } from "@/lib/ai/dev-mode";
import { DeliverClient } from "./deliver-client";

function isChecklistComplete(checklistJson: string | null) {
  if (!checklistJson) return false;
  const items = JSON.parse(checklistJson) as ChecklistItem[];
  return items.length > 0 && items.every((i) => i.done);
}

export default async function DeliverPage() {
  const user = await requireUser();
  const agency = await getCurrentAgency(user.id, user.email);
  requireStageAccess(agency, "deliver");

  const client =
    agency.clients.find(
      (c) => !isChecklistComplete(c.deliveryChecklistJson) || !c.testimonialRequestedAt
    ) ?? agency.clients[0];

  if (!client) {
    redirect("/");
  }

  const devMode = isAiDevMode();

  let checklist: ChecklistItem[] | null = null;
  if (client.deliveryChecklistJson) {
    checklist = JSON.parse(client.deliveryChecklistJson);
  } else if (!devMode) {
    checklist = await getDeliveryChecklist(agency.offerService!);
    await prisma.client.update({
      where: { id: client.id },
      data: {
        deliveryChecklistJson: JSON.stringify(checklist),
        projectStatus: "in_progress",
      },
    });
  }

  // In dev mode the checklist prompt is only needed when no checklist
  // exists yet; the status-update and testimonial prompts are fetched on
  // demand by the client since they depend on live checklist state.
  const devChecklistPrompt =
    devMode && !checklist ? buildChecklistPrompt(agency.offerService!) : null;

  return (
    <DeliverClient
      clientId={client.id}
      brandName={agency.brandName}
      leadName={client.lead?.name ?? "your client"}
      checklist={checklist}
      testimonialRequestedAt={client.testimonialRequestedAt}
      devMode={devMode}
      devChecklistPrompt={devChecklistPrompt}
    />
  );
}
