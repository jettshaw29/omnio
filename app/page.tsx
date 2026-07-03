import { prisma } from "@/lib/prisma";
import { computeMissionControlState } from "@/lib/mission-control";
import { MissionControlCard } from "@/components/mission-control-card";

// Stand-in for auth (02_TECH_ARCHITECTURE.md §6 — auth method is still an open
// decision). Until real sign-in exists, this resolves to the one seeded
// agency so Mission Control has something real to render against.
async function getCurrentAgency() {
  const agency = await prisma.agency.findFirst({
    include: { website: true, leads: true, clients: true, milestones: true },
    orderBy: { createdAt: "asc" },
  });
  if (!agency) {
    throw new Error("No agency found — run `npx prisma db seed` first.");
  }
  return agency;
}

export default async function MissionControlPage() {
  const agency = await getCurrentAgency();
  const state = computeMissionControlState(agency);

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <header className="flex items-center justify-between px-8 py-6">
        <span className="text-body font-medium text-text-primary">
          {agency.brandName ?? "Omnio"}
        </span>
      </header>

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
