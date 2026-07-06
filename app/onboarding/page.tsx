export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { getNextInterviewStep, buildInterviewPrompt } from "@/lib/ai/interview";
import { isAiDevMode } from "@/lib/ai/dev-mode";
import { InterviewClient } from "./interview-client";

export default async function OnboardingPage() {
  const user = await requireUser();
  const agency = await getCurrentAgency(user.id, user.email);
  requireStageAccess(agency, "niche");

  // Live: fetched server-side so the first question is already there on
  // paint. Dev mode: the first turn comes from a hand-pasted response
  // instead, so pass the prompt for it rather than calling the API.
  const devMode = isAiDevMode();
  const firstStep = devMode ? null : await getNextInterviewStep([]);
  const initialDevPrompt = devMode ? buildInterviewPrompt([]) : null;

  return (
    <InterviewClient
      agencyId={agency.id}
      brandName={agency.brandName}
      initialStep={firstStep}
      initialDevPrompt={initialDevPrompt}
    />
  );
}
