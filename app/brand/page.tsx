import { requireUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { getBrandProposal } from "@/lib/ai/brand";
import { BrandClient } from "./brand-client";

export default async function BrandPage() {
  const user = await requireUser();
  const agency = await getCurrentAgency(user.id, user.email!);
  requireStageAccess(agency, "brand");

  const initialProposal =
    agency.brandName && agency.positioningStatement
      ? {
          name: agency.brandName,
          positioning: agency.positioningStatement,
          reasoning: "Already locked in — edit and re-confirm if you want to change it.",
        }
      : await getBrandProposal(agency.niche!, agency.offerService!);

  return (
    <BrandClient
      agencyId={agency.id}
      brandName={agency.brandName}
      niche={agency.niche!}
      service={agency.offerService!}
      initialProposal={initialProposal}
    />
  );
}
