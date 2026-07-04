import { requireUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { getOfferProposal, buildOfferPrompt } from "@/lib/ai/offer";
import { isAiDevMode } from "@/lib/ai/dev-mode";
import { OfferClient } from "./offer-client";

export default async function OfferPage() {
  const user = await requireUser();
  const agency = await getCurrentAgency(user.id, user.email);
  requireStageAccess(agency, "offer");

  const alreadyLocked = agency.offerService && agency.offerPriceCents;

  // Three sources of the initial proposal, in priority order: an
  // already-locked offer (editable), a dev-mode hand-paste, or a live/mock
  // API call. Dev mode defers generation to the pasted response.
  const initialProposal = alreadyLocked
    ? {
        service: agency.offerService!,
        priceCents: agency.offerPriceCents!,
        reasoning: "Already locked in — edit and re-confirm if you want to change it.",
      }
    : isAiDevMode()
      ? null
      : await getOfferProposal(agency.niche!);

  const devPrompt =
    !alreadyLocked && isAiDevMode() ? buildOfferPrompt(agency.niche!) : null;

  return (
    <OfferClient
      agencyId={agency.id}
      brandName={agency.brandName}
      niche={agency.niche!}
      initialProposal={initialProposal}
      devPrompt={devPrompt}
    />
  );
}
