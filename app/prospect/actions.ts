"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buildProspectStrategy, type ProspectStrategy } from "@/lib/ai/prospect";

export async function saveProspectStrategy(
  agencyId: string,
  strategy: ProspectStrategy
): Promise<void> {
  await prisma.agency.update({
    where: { id: agencyId },
    data: { prospectStrategyJson: JSON.stringify(strategy) },
  });
  revalidatePath("/prospect");
  revalidatePath("/");
}

export async function generateProspectStrategy(
  agencyId: string,
  niche: string,
  service: string,
  brandName: string
): Promise<ProspectStrategy> {
  const strategy = await buildProspectStrategy(niche, service, brandName);
  await prisma.agency.update({
    where: { id: agencyId },
    data: { prospectStrategyJson: JSON.stringify(strategy) },
  });
  revalidatePath("/");
  return strategy;
}
