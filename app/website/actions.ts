"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getWebsiteContent, type WebsiteContent } from "@/lib/ai/website";
import { runPreflight } from "@/lib/website-preflight";
import { slugify } from "@/lib/slug";

// Shared by the live path (page.tsx, content from the API) and the dev-mode
// path (createDevWebsite below, content from a hand-pasted response) — one
// place slug allocation lives either way.
export async function createWebsiteRecord(
  agencyId: string,
  brandName: string,
  content: WebsiteContent
) {
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

// Dev mode: persist a hand-pasted generation, then let the page re-render
// with the real record — from here on the flow is identical to live.
export async function createDevWebsite(
  agencyId: string,
  brandName: string,
  content: WebsiteContent
) {
  await createWebsiteRecord(agencyId, brandName, content);
  revalidatePath("/website");
  revalidatePath("/");
}

export async function saveSection(
  websiteId: string,
  field: keyof WebsiteContent,
  value: string
) {
  const website = await prisma.website.findUniqueOrThrow({ where: { id: websiteId } });
  const content = JSON.parse(website.contentJson ?? "{}") as WebsiteContent;
  const updated: WebsiteContent =
    field === "solutionSteps"
      ? { ...content, solutionSteps: JSON.parse(value) }
      : { ...content, [field]: value };

  await prisma.website.update({
    where: { id: websiteId },
    data: { contentJson: JSON.stringify(updated) },
  });
}

// Regenerates the full draft under the hood and returns just the one
// section asked for — simpler than maintaining a separate prompt per field,
// and cheap enough at this scale not to matter.
export async function regenerateSection(
  websiteId: string,
  field: keyof WebsiteContent,
  ctx: { niche: string; service: string; brandName: string; positioning: string }
): Promise<WebsiteContent[typeof field]> {
  const fresh = await getWebsiteContent(ctx);
  const website = await prisma.website.findUniqueOrThrow({ where: { id: websiteId } });
  const content = JSON.parse(website.contentJson ?? "{}") as WebsiteContent;
  const updated = { ...content, [field]: fresh[field] };

  await prisma.website.update({
    where: { id: websiteId },
    data: { contentJson: JSON.stringify(updated) },
  });

  return fresh[field];
}

export async function publishWebsite(websiteId: string, agencyId: string) {
  const website = await prisma.website.findUniqueOrThrow({ where: { id: websiteId } });
  const content = JSON.parse(website.contentJson ?? "{}") as WebsiteContent;
  const checks = runPreflight(content);
  if (checks.some((c) => !c.passed)) {
    throw new Error("Preflight checks are not all passing.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.website.update({
      where: { id: websiteId },
      data: { status: "published", publishedAt: new Date() },
    });
    await tx.milestone.upsert({
      where: { agencyId_key: { agencyId, key: "published" } },
      update: {},
      create: { agencyId, key: "published" },
    });
  });

  redirect("/celebrate/website_live");
}
