"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  buildProspectStrategy,
  buildEvalPrompt,
  evaluateProspects,
  type ProspectStrategy,
  type ProspectEvaluation,
} from "@/lib/ai/prospect";

export async function saveProspectStrategy(
  agencyId: string,
  strategy: ProspectStrategy
): Promise<void> {
  await prisma.agency.update({
    where: { id: agencyId },
    data: { prospectStrategyJson: JSON.stringify(strategy) },
  });
  revalidatePath("/prospect");
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
  return strategy;
}

// Live-mode: call API, persist result, mark stage complete
export async function evaluateProspectsAction(
  agencyId: string,
  candidates: string,
  niche: string,
  service: string,
  strategy: ProspectStrategy
): Promise<ProspectEvaluation> {
  const evaluation = await evaluateProspects(candidates, niche, service, strategy);
  await prisma.agency.update({
    where: { id: agencyId },
    data: { prospectEvaluatedAt: new Date() },
  });
  revalidatePath("/");
  return evaluation;
}

// Dev-mode: build the eval prompt so the user can relay it to Claude.ai
export async function getEvalDevPrompt(
  agencyId: string,
  candidates: string
): Promise<string> {
  const agency = await prisma.agency.findUniqueOrThrow({ where: { id: agencyId } });
  const strategy = JSON.parse(agency.prospectStrategyJson!) as ProspectStrategy;
  return buildEvalPrompt(candidates, agency.niche!, agency.offerService!, strategy);
}

// Called after a dev-mode eval paste is accepted — persists the completion
export async function markProspectEvaluated(agencyId: string): Promise<void> {
  await prisma.agency.update({
    where: { id: agencyId },
    data: { prospectEvaluatedAt: new Date() },
  });
  revalidatePath("/");
}
