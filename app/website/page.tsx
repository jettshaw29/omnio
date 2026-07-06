export const dynamic = "force-dynamic";
import { requireUser } from "@/lib/auth";
import { getCurrentAgency } from "@/lib/current-agency";
import { requireStageAccess } from "@/lib/journey";
import { getWebsiteContent, buildWebsitePrompt, type WebsiteContent } from "@/lib/ai/website";
import { isAiDevMode } from "@/lib/ai/dev-mode";
import { createWebsiteRecord } from "./actions";
import { WebsiteBuilderClient } from "./website-builder-client";

export default async function WebsitePage() {
  const user = await requireUser();
  const agency = await getCurrentAgency(user.id, user.email);
  requireStageAccess(agency, "website");

  const ctx = {
    niche: agency.niche!,
    service: agency.offerService!,
    brandName: agency.brandName!,
    positioning: agency.positioningStatement ?? "",
  };

  const devMode = isAiDevMode();
  // In dev mode the whole-site prompt is always available: it powers first
  // generation when no site exists yet, and per-section regenerates after.
  const devPrompt = devMode ? buildWebsitePrompt(ctx) : null;

  let website = agency.website;
  let justGenerated = false;
  if (!website && !devMode) {
    const content = await getWebsiteContent(ctx);
    website = await createWebsiteRecord(agency.id, agency.brandName!, content);
    justGenerated = true;
  }

  const content = website
    ? (JSON.parse(website.contentJson ?? "{}") as WebsiteContent)
    : null;

  return (
    <WebsiteBuilderClient
      agencyId={agency.id}
      websiteId={website?.id ?? null}
      initialContent={content}
      justGenerated={justGenerated}
      alreadyPublished={website?.status === "published"}
      brandName={agency.brandName!}
      offerService={agency.offerService!}
      offerPriceCents={agency.offerPriceCents!}
      ctx={ctx}
      devPrompt={devPrompt}
    />
  );
}
