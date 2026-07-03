"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBrandProposal, type BrandProposal } from "@/lib/ai/brand";

export async function regenerateBrand(
  niche: string,
  service: string
): Promise<BrandProposal> {
  return getBrandProposal(niche, service);
}

export async function confirmBrand(
  agencyId: string,
  name: string,
  positioning: string
) {
  await prisma.agency.update({
    where: { id: agencyId },
    data: {
      brandName: name,
      positioningStatement: positioning,
      brandLockedAt: new Date(),
    },
  });

  redirect("/");
}
