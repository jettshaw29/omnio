import { prisma } from "./prisma";
import type { AgencyWithRelations } from "./journey";

const AGENCY_INCLUDE = {
  website: true,
  leads: { orderBy: { createdAt: "desc" as const } },
  clients: { include: { lead: true }, orderBy: { createdAt: "asc" as const } },
  milestones: true,
};

/**
 * One canonical fetch, used by every guided screen and Mission Control, so
 * the shape the Journey Engine reads from is never subtly different from
 * one page to the next. Auto-provisions a blank Agency on a user's very
 * first request — this is the one place "someone just signed up" turns
 * into "they have an agency to build," replacing the old manual seed
 * script now that real multi-tenant signup exists.
 */
export async function getCurrentAgency(
  userId: string,
  email: string
): Promise<AgencyWithRelations> {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email },
  });

  const existing = await prisma.agency.findUnique({
    where: { userId },
    include: AGENCY_INCLUDE,
  });
  if (existing) return existing;

  return prisma.agency.create({
    data: { userId },
    include: AGENCY_INCLUDE,
  });
}
