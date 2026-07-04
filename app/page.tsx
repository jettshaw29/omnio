import { getCurrentAgency } from "@/lib/current-agency";
import { computeMissionControlState } from "@/lib/journey";
import { MissionControlCard } from "@/components/mission-control-card";
import { JourneyHeader } from "@/components/journey-header";

export default async function MissionControlPage() {
  const agency = await getCurrentAgency();
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
