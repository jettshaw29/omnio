import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOfferProposal } from "@/lib/ai/offer";
import { OfferClient } from "./offer-client";

async function getCurrentAgency() {
  const agency = await prisma.agency.findFirst({ orderBy: { createdAt: "asc" } });
  if (!agency) {
    throw new Error("No agency found — run `npx prisma db seed` first.");
  }
  return agency;
}

export default async function OfferPage() {
  const agency = await getCurrentAgency();
  if (!agency.niche) {
    // Can't define an offer before a niche is locked — send back to the
    // state machine rather than rendering a broken screen.
    redirect("/");
  }

  const initialProposal =
    agency.offerService && agency.offerPriceCents
      ? {
          service: agency.offerService,
          priceCents: agency.offerPriceCents,
          reasoning: "Already locked in — edit and re-confirm if you want to change it.",
        }
      : await getOfferProposal(agency.niche);

  return (
    <OfferClient
      agencyId={agency.id}
      niche={agency.niche}
      initialProposal={initialProposal}
    />
  );
}
