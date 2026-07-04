import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { getNextInterviewStep } from "@/lib/ai/interview";
import { InterviewClient } from "./interview-client";

export default async function OnboardingPage() {
  const agency = await getCurrentAgency();
  requireStageAccess(agency, "niche");

  // Fetched server-side so the first question is already there on paint —
  // no client-side loading flash for the very first turn.
  const firstStep = await getNextInterviewStep([]);

  return (
    <InterviewClient
      agencyId={agency.id}
      brandName={agency.brandName}
      initialStep={firstStep}
    />
  );
}
