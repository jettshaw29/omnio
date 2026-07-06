export const dynamic = "force-dynamic";

import { getOptionalUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { computeMissionControlState } from "@/lib/journey";
import { MissionControlCard } from "@/components/mission-control-card";
import { JourneyHeader } from "@/components/journey-header";
import { LandingPage } from "./landing-page";

export default async function HomePage() {
  const user = await getOptionalUser();

  if (!user) {
    return <LandingPage />;
  }

  const agency = await getCurrentAgency(user.id, user.email!);
  const state = computeMissionControlState(agency);

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <JourneyHeader brandName={agency.brandName} />
      <main className="flex-1 flex items-center justify-center px-6">
        <MissionControlCard
          sentence={state.sentence}
          reasoning={state.reasoning}
          actionLabel={state.actionLabel}
          actionHref={state.actionHref}
        />
      </main>
    </div>
  );
}
