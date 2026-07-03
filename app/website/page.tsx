import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebsiteContent, type WebsiteContent } from "@/lib/ai/website";
import { slugify } from "@/lib/slug";
import { WebsiteBuilderClient } from "./website-builder-client";

async function getCurrentAgency() {
  const agency = await prisma.agency.findFirst({
    orderBy: { createdAt: "asc" },
    include: { website: true },
  });
  if (!agency) {
    throw new Error("No agency found — run `npx prisma db seed` first.");
  }
  return agency;
}

async function createUniqueWebsite(agencyId: string, brandName: string, content: WebsiteContent) {
  const base = slugify(brandName) || "agency";
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      return await prisma.website.create({
        data: { agencyId, slug, status: "draft", contentJson: JSON.stringify(content) },
      });
    } catch {
      // slug collision — retry with a suffix
    }
  }
  throw new Error("Could not allocate a unique website slug.");
}

export default async function WebsitePage() {
  const agency = await getCurrentAgency();
  if (!agency.niche || !agency.offerService || !agency.offerPriceCents || !agency.brandName) {
    redirect("/");
  }

  const ctx = {
    niche: agency.niche,
    service: agency.offerService,
    brandName: agency.brandName,
    positioning: agency.positioningStatement ?? "",
  };

  let website = agency.website;
  let justGenerated = false;
  if (!website) {
    const content = await getWebsiteContent(ctx);
    website = await createUniqueWebsite(agency.id, agency.brandName, content);
    justGenerated = true;
  }

  const content = JSON.parse(website.contentJson ?? "{}") as WebsiteContent;

  return (
    <WebsiteBuilderClient
      agencyId={agency.id}
      websiteId={website.id}
      initialContent={content}
      justGenerated={justGenerated}
      alreadyPublished={website.status === "published"}
      brandName={agency.brandName}
      offerService={agency.offerService}
      offerPriceCents={agency.offerPriceCents}
      ctx={ctx}
    />
  );
}
