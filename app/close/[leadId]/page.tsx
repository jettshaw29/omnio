export const dynamic = "force-dynamic";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { getProposal, buildProposalPrompt } from "@/lib/ai/proposal";
import { isAiDevMode } from "@/lib/ai/dev-mode";
import { CloseClientForm } from "./close-client-form";

export default async function CloseClientPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const user = await requireUser();
  const agency = await getCurrentAgency(user.id, user.email!);
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

  const devMode = isAiDevMode();
  const proposal = devMode ? null : await getProposal(lead.name, lead.business, ctx);
  const devPrompt = devMode ? buildProposalPrompt(lead.name, lead.business, ctx) : null;

  return (
    <CloseClientForm
      agencyId={agency.id}
      brandName={agency.brandName}
      leadId={lead.id}
      leadName={lead.name}
      offerService={agency.offerService!}
      offerPriceCents={agency.offerPriceCents!}
      initialProposal={proposal}
      devPrompt={devPrompt}
      ctx={ctx}
    />
  );
}
