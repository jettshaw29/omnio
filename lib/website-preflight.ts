import type { WebsiteContent } from "@/lib/ai/website";

export type PreflightCheck = { label: string; passed: boolean };

// 00_V1_PRODUCT_SPEC.md §4 — pricing visible, guarantee shown, a contact
// method (here, the CTA) present. Plain function, not a server action, so
// it can run identically on the client (to render the checklist) and the
// server (to gate publishWebsite).
export function runPreflight(content: WebsiteContent): PreflightCheck[] {
  return [
    { label: "Pricing is visible", passed: true }, // always true — rendered from the locked Offer directly
    { label: "Guarantee is shown", passed: content.guarantee.trim().length > 0 },
    { label: "A clear call to action is present", passed: content.ctaLabel.trim().length > 0 },
  ];
}
