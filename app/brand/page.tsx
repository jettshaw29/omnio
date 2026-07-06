export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { getBrandProposal, buildBrandPrompt } from "@/lib/ai/brand";
import { isAiDevMode } from "@/lib/ai/dev-mode";
import { BrandClient } from "./brand-client";

export default async function BrandPage() {
  const user = await requireUser();
  const agency = await getCurrentAgency(user.id, user.email);
  requireStageAccess(agency, "brand");

  const alreadyLocked = agency.brandName && agency.positioningStatement;

  const initialProposal = alreadyLocked
    ? {
        name: agency.brandName!,
        positioning: agency.positioningStatement!,
        reasoning: "Already locked in — edit and re-confirm if you want to change it.",
      }
    : isAiDevMode()
      ? null
      : await getBrandProposal(agency.niche!, agency.offerService!);

  const devPrompt =
    !alreadyLocked && isAiDevMode()
      ? buildBrandPrompt(agency.niche!, agency.offerService!)
      : null;

  return (
    <BrandClient
      agencyId={agency.id}
      brandName={agency.brandName}
      niche={agency.niche!}
      service={agency.offerService!}
      initialProposal={initialProposal}
      devPrompt={devPrompt}
    />
  );
}
