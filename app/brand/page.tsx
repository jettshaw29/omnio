import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBrandProposal } from "@/lib/ai/brand";
import { BrandClient } from "./brand-client";

async function getCurrentAgency() {
  const agency = await prisma.agency.findFirst({ orderBy: { createdAt: "asc" } });
  if (!agency) {
    throw new Error("No agency found — run `npx prisma db seed` first.");
  }
  return agency;
}

export default async function BrandPage() {
  const agency = await getCurrentAgency();
  if (!agency.niche || !agency.offerService) {
    // Can't build a brand before niche + offer exist — back to the state
    // machine rather than a broken screen.
    redirect("/");
  }

  const initialProposal =
    agency.brandName && agency.positioningStatement
      ? {
          name: agency.brandName,
          positioning: agency.positioningStatement,
          reasoning: "Already locked in — edit and re-confirm if you want to change it.",
        }
      : await getBrandProposal(agency.niche, agency.offerService);

  return (
    <BrandClient
      agencyId={agency.id}
      niche={agency.niche}
      service={agency.offerService}
      initialProposal={initialProposal}
    />
  );
}
