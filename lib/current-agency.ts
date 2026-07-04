import { prisma } from "./prisma";
import type { AgencyWithRelations } from "./journey";

// One canonical fetch, used by every guided screen and Mission Control, so
// the shape the Journey Engine reads from is never subtly different from
// one page to the next (02_TECH_ARCHITECTURE.md §6 — auth is still an open
// decision, so this resolves to the one seeded agency until real sign-in
// exists).
export async function getCurrentAgency(): Promise<AgencyWithRelations> {
  const agency = await prisma.agency.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      website: true,
      leads: { orderBy: { createdAt: "desc" } },
      clients: { include: { lead: true }, orderBy: { createdAt: "asc" } },
      milestones: true,
    },
  });
  if (!agency) {
    throw new Error("No agency found — run `npx prisma db seed` first.");
  }
  return agency;
}
