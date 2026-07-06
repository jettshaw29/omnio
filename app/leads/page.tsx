export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { isAiDevMode } from "@/lib/ai/dev-mode";
import { LeadsClient } from "./leads-client";

export default async function LeadsPage() {
  const user = await requireUser();
  const agency = await getCurrentAgency(user.id, user.email);
  requireStageAccess(agency, "outreach");

  return (
    <LeadsClient
      agencyId={agency.id}
      brandName={agency.brandName}
      leads={agency.leads}
      ctx={{
        niche: agency.niche!,
        service: agency.offerService!,
        brandName: agency.brandName!,
        positioning: agency.positioningStatement ?? "",
      }}
      devMode={isAiDevMode()}
    />
  );
}
