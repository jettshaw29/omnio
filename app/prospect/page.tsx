import { requireUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { isAiDevMode } from "@/lib/ai/dev-mode";
import { buildProspectPrompt, buildProspectStrategy, type ProspectStrategy } from "@/lib/ai/prospect";
import { prisma } from "@/lib/prisma";
import { ProspectClient } from "./prospect-client";

export default async function ProspectPage() {
  const user = await requireUser();
  const agency = await getCurrentAgency(user.id, user.email);
  requireStageAccess(agency, "prospect");

  const devMode = isAiDevMode();

  let strategy: ProspectStrategy | null = null;
  if (agency.prospectStrategyJson) {
    strategy = JSON.parse(agency.prospectStrategyJson);
  } else if (!devMode) {
    strategy = await buildProspectStrategy(
      agency.niche!,
      agency.offerService!,
      agency.brandName!
    );
    await prisma.agency.update({
      where: { id: agency.id },
      data: { prospectStrategyJson: JSON.stringify(strategy) },
    });
  }

  const devPrompt =
    devMode && !strategy
      ? buildProspectPrompt(agency.niche!, agency.offerService!, agency.brandName!)
      : null;

  return (
    <ProspectClient
      agencyId={agency.id}
      brandName={agency.brandName}
      niche={agency.niche!}
      initialStrategy={strategy}
      devPrompt={devPrompt}
    />
  );
}
