import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProposal } from "@/lib/ai/proposal";
import { CloseClientForm } from "./close-client-form";

async function getCurrentAgency() {
  const agency = await prisma.agency.findFirst({ orderBy: { createdAt: "asc" } });
  if (!agency) {
    throw new Error("No agency found — run `npx prisma db seed` first.");
  }
  return agency;
}

export default async function CloseClientPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const agency = await getCurrentAgency();
  if (!agency.niche || !agency.offerService || !agency.offerPriceCents || !agency.brandName) {
    redirect("/");
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead || lead.agencyId !== agency.id) {
    notFound();
  }
  if (lead.status === "closed") {
    redirect("/leads");
  }

  const ctx = {
    niche: agency.niche,
    service: agency.offerService,
    brandName: agency.brandName,
    positioning: agency.positioningStatement ?? "",
  };

  const proposal = await getProposal(lead.name, lead.business, ctx);

  return (
    <CloseClientForm
      agencyId={agency.id}
      leadId={lead.id}
      leadName={lead.name}
      offerService={agency.offerService}
      offerPriceCents={agency.offerPriceCents}
      initialProposal={proposal}
      ctx={ctx}
    />
  );
}
