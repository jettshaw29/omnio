import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LeadsClient } from "./leads-client";

async function getCurrentAgency() {
  const agency = await prisma.agency.findFirst({
    orderBy: { createdAt: "asc" },
    include: { website: true, leads: { orderBy: { createdAt: "desc" } } },
  });
  if (!agency) {
    throw new Error("No agency found — run `npx prisma db seed` first.");
  }
  return agency;
}

export default async function LeadsPage() {
  const agency = await getCurrentAgency();
  if (!agency.website || agency.website.status !== "published") {
    // No live site yet — nothing to point leads to. Back to the state machine.
    redirect("/");
  }
  if (!agency.niche || !agency.offerService || !agency.brandName) {
    redirect("/");
  }

  return (
    <LeadsClient
      agencyId={agency.id}
      leads={agency.leads}
      ctx={{
        niche: agency.niche,
        service: agency.offerService,
        brandName: agency.brandName,
        positioning: agency.positioningStatement ?? "",
      }}
    />
  );
}
