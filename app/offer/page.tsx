import { requireUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { getOfferProposal } from "@/lib/ai/offer";
import { OfferClient } from "./offer-client";

export default async function OfferPage() {
  const user = await requireUser();
  const agency = await getCurrentAgency(user.id, user.email!);
  requireStageAccess(agency, "offer");

  const initialProposal =
    agency.offerService && agency.offerPriceCents
      ? {
          service: agency.offerService,
          priceCents: agency.offerPriceCents,
          reasoning: "Already locked in — edit and re-confirm if you want to change it.",
        }
      : await getOfferProposal(agency.niche!);

  return (
    <OfferClient
      agencyId={agency.id}
      brandName={agency.brandName}
      niche={agency.niche!}
      initialProposal={initialProposal}
    />
  );
}
