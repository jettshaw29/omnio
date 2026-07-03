"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProposal, type ProposalContent } from "@/lib/ai/proposal";

export async function regenerateProposal(
  leadId: string,
  ctx: { niche: string; service: string; brandName: string; positioning: string }
): Promise<ProposalContent> {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });
  return getProposal(lead.name, lead.business, ctx);
}

// Signing is where the deposit-structured pricing (lib/ai/offer.ts §5) pays
// off: a big enough deposit can cross the $1,000 milestone at the moment of
// signing, before any delivery happens (00_V1_PRODUCT_SPEC.md §3's note on
// why 8/9 aren't strictly sequential). Both milestones are checked
// independently here and queued as separate celebrations if both just fired.
export async function signClient(
  leadId: string,
  agencyId: string,
  depositDollars: number
) {
  const depositCents = Math.round(depositDollars * 100);

  await prisma.client.create({
    data: { agencyId, leadId, amountPaidCents: depositCents },
  });
  await prisma.lead.update({ where: { id: leadId }, data: { status: "closed" } });

  const queue: string[] = [];

  const hadFirstClient = await prisma.milestone.findUnique({
    where: { agencyId_key: { agencyId, key: "first_client_signed" } },
  });
  if (!hadFirstClient) {
    await prisma.milestone.create({ data: { agencyId, key: "first_client_signed" } });
    queue.push("first_client");
  }

  const totalPaid = await prisma.client.aggregate({
    where: { agencyId },
    _sum: { amountPaidCents: true },
  });
  const hadFirst1000 = await prisma.milestone.findUnique({
    where: { agencyId_key: { agencyId, key: "first_1000" } },
  });
  if (!hadFirst1000 && (totalPaid._sum.amountPaidCents ?? 0) >= 100000) {
    await prisma.milestone.create({ data: { agencyId, key: "first_1000" } });
    queue.push("first_1000");
  }

  if (queue.length === 0) redirect("/");
  const [first, ...rest] = queue;
  redirect(`/celebrate/${first}${rest.length ? `?queue=${rest.join(",")}` : ""}`);
}
