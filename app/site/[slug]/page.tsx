import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WebsiteTemplate } from "@/components/website-template";
import type { WebsiteContent } from "@/lib/ai/website";

// The published public agency site — same WebsiteTemplate component as the
// Builder's live preview, mode="view", so there's no gap between what was
// edited and what's actually live (02_TECH_ARCHITECTURE.md §5).
export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const website = await prisma.website.findUnique({
    where: { slug },
    include: { agency: true },
  });

  if (!website || website.status !== "published" || !website.agency.brandName) {
    notFound();
  }

  const content = JSON.parse(website.contentJson ?? "{}") as WebsiteContent;

  return (
    <WebsiteTemplate
      mode="view"
      content={content}
      brandName={website.agency.brandName}
      offerService={website.agency.offerService ?? ""}
      offerPriceCents={website.agency.offerPriceCents ?? 0}
    />
  );
}
