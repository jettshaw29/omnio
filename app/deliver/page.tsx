import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { getDeliveryChecklist, type ChecklistItem } from "@/lib/ai/delivery";
import { DeliverClient } from "./deliver-client";

function isChecklistComplete(checklistJson: string | null) {
  if (!checklistJson) return false;
  const items = JSON.parse(checklistJson) as ChecklistItem[];
  return items.length > 0 && items.every((i) => i.done);
}

export default async function DeliverPage() {
  const agency = await getCurrentAgency();
  requireStageAccess(agency, "deliver");

  const client =
    agency.clients.find(
      (c) => !isChecklistComplete(c.deliveryChecklistJson) || !c.testimonialRequestedAt
    ) ?? agency.clients[0];

  if (!client) {
    redirect("/");
  }

  let checklist: ChecklistItem[];
  if (client.deliveryChecklistJson) {
    checklist = JSON.parse(client.deliveryChecklistJson);
  } else {
    checklist = await getDeliveryChecklist(agency.offerService!);
    await prisma.client.update({
      where: { id: client.id },
      data: {
        deliveryChecklistJson: JSON.stringify(checklist),
        projectStatus: "in_progress",
      },
    });
  }

  return (
    <DeliverClient
      clientId={client.id}
      brandName={agency.brandName}
      leadName={client.lead?.name ?? "your client"}
      checklist={checklist}
      testimonialRequestedAt={client.testimonialRequestedAt}
    />
  );
}
