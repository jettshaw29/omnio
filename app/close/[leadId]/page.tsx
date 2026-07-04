import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { getProposal } from "@/lib/ai/proposal";
import { CloseClientForm } from "./close-client-form";

export default async function CloseClientPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const agency = await getCurrentAgency();
  // Close is reached from the Leads workspace, so it shares Leads' gate
  // (a published site) rather than requiring a specific lead status —
  // closing a client informally, without ever flipping the status dropdown
  // to "Call Booked" first, is a legitimate real-world path.
  requireStageAccess(agency, "outreach");

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.agencyId !== agency.id) {
    notFound();
  }
  if (lead.status === "closed") {
    redirect("/leads");
  }

  const ctx = {
    niche: agency.niche!,
    service: agency.offerService!,
    brandName: agency.brandName!,
    positioning: agency.positioningStatement ?? "",
  };

  const proposal = await getProposal(lead.name, lead.business, ctx);

  return (
    <CloseClientForm
      agencyId={agency.id}
      brandName={agency.brandName}
      leadId={lead.id}
      leadName={lead.name}
      offerService={agency.offerService!}
      offerPriceCents={agency.offerPriceCents!}
      initialProposal={proposal}
      ctx={ctx}
    />
  );
}
