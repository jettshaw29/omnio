"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getWebsiteContent, type WebsiteContent } from "@/lib/ai/website";
import { runPreflight } from "@/lib/website-preflight";

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

  redirect("/");
}
