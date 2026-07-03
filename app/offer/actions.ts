"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOfferProposal, type OfferProposal } from "@/lib/ai/offer";

export async function regenerateOffer(niche: string): Promise<OfferProposal> {
  return getOfferProposal(niche);
}

export async function confirmOffer(
  agencyId: string,
  service: string,
  priceDollars: number
) {
  await prisma.agency.update({
    where: { id: agencyId },
    data: {
      offerService: service,
      offerPriceCents: Math.round(priceDollars * 100),
      offerLockedAt: new Date(),
    },
  });

  redirect("/");
}
