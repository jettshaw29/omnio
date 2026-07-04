"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WebsiteTemplate } from "@/components/website-template";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { publishWebsite, regenerateSection, saveSection } from "./actions";
import { runPreflight, type PreflightCheck } from "@/lib/website-preflight";
import type { WebsiteContent } from "@/lib/ai/website";

const SECTION_COUNT = 8; // headline, subheadline+cta, problem, solution, proof, pricing, guarantee, bottom cta

export function WebsiteBuilderClient({
  agencyId,
  websiteId,
  initialContent,
  justGenerated,
  brandName,
  offerService,
  offerPriceCents,
  ctx,
}: {
  agencyId: string;
  websiteId: string;
  initialContent: WebsiteContent;
  justGenerated: boolean;
  alreadyPublished: boolean;
  brandName: string;
  offerService: string;
  offerPriceCents: number;
  ctx: { niche: string; service: string; brandName: string; positioning: string };
}) {
  const [content, setContent] = useState(initialContent);
  const [regeneratingField, setRegeneratingField] = useState<keyof WebsiteContent | null>(
    null
  );
  const [revealCount, setRevealCount] = useState(justGenerated ? 0 : SECTION_COUNT);
  const [showPreflight, setShowPreflight] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [savedField, setSavedField] = useState<keyof WebsiteContent | null>(null);

  // The site visibly assembling top-to-bottom IS the loading state for
  // generation (07_VISUAL_DESIGN_SYSTEM.md §1 — momentum), not a spinner
  // shown before the reveal.
  useEffect(() => {
    if (!justGenerated) return;
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setRevealCount(count);
      if (count >= SECTION_COUNT) clearInterval(interval);
    }, 250);
    return () => clearInterval(interval);
  }, [justGenerated]);

  function handleFieldChange(field: keyof WebsiteContent, value: string) {
    setContent((prev) =>
      field === "solutionSteps"
        ? { ...prev, solutionSteps: JSON.parse(value) }
        : { ...prev, [field]: value }
    );
  }

  async function handleFieldBlur(field: keyof WebsiteContent) {
    const value =
      field === "solutionSteps" ? JSON.stringify(content.solutionSteps) : (content[field] as string);
    await saveSection(websiteId, field, value);
    setSavedField(field);
    setTimeout(() => setSavedField(null), 1500);
  }

  async function handleRegenerate(field: keyof WebsiteContent) {
    setRegeneratingField(field);
    const fresh = await regenerateSection(websiteId, field, ctx);
    setContent((prev) => ({ ...prev, [field]: fresh }));
    setRegeneratingField(null);
  }

  const checks: PreflightCheck[] = runPreflight(content);
  const allPassed = checks.every((c) => c.passed);

  async function handleGoLive() {
    setIsPublishing(true);
    await publishWebsite(websiteId, agencyId);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <Link href="/" className="text-body font-medium text-text-primary">
          {brandName}
        </Link>
        <div className="flex items-center gap-3">
          {savedField && <span className="text-small text-pine">Saved ✓</span>}
          <Button variant="primary" onClick={() => setShowPreflight(true)}>
            Publish
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <WebsiteTemplate
          mode="edit"
          content={content}
          brandName={brandName}
          offerService={offerService}
          offerPriceCents={offerPriceCents}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
          onRegenerate={handleRegenerate}
          regeneratingField={regeneratingField}
          revealCount={revealCount}
        />
      </main>

      {showPreflight && (
        <div className="fixed inset-0 bg-text-primary/20 flex items-center justify-center px-6">
          <Card className="max-w-[480px] w-full p-8 flex flex-col gap-6">
            <h2 className="text-h2 font-semibold text-text-primary">Ready to go live?</h2>
            <ul className="flex flex-col gap-3">
              {checks.map((check) => (
                <li key={check.label} className="flex items-center gap-3">
                  <span
                    className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-small ${
                      check.passed ? "bg-pine text-white" : "bg-border text-text-tertiary"
                    }`}
                  >
                    {check.passed ? "✓" : ""}
                  </span>
                  <span className="text-body text-text-primary">{check.label}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                onClick={handleGoLive}
                disabled={!allPassed || isPublishing}
              >
                {isPublishing ? "Going live..." : "Go Live"}
              </Button>
              <Button variant="text" onClick={() => setShowPreflight(false)} disabled={isPublishing}>
                Not yet
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
