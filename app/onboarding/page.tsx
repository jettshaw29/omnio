import { prisma } from "@/lib/prisma";
import { getNextInterviewStep } from "@/lib/ai/interview";
import { InterviewClient } from "./interview-client";

async function getCurrentAgency() {
  const agency = await prisma.agency.findFirst({ orderBy: { createdAt: "asc" } });
  if (!agency) {
    throw new Error("No agency found — run `npx prisma db seed` first.");
  }
  return agency;
}

export default async function OnboardingPage() {
  const agency = await getCurrentAgency();
  // Fetched server-side so the first question is already there on paint —
  // no client-side loading flash for the very first turn.
  const firstStep = await getNextInterviewStep([]);

  return <InterviewClient agencyId={agency.id} initialStep={firstStep} />;
}
