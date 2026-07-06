"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WebsiteTemplate } from "@/components/website-template";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DevAiStep } from "@/components/dev-ai-step";
import { createDevWebsite, publishWebsite, regenerateSection, saveSection } from "./actions";
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
  devPrompt,
}: {
  agencyId: string;
  websiteId: string | null;
  initialContent: WebsiteContent | null;
  justGenerated: boolean;
  alreadyPublished: boolean;
  brandName: string;
  offerService: string;
  offerPriceCents: number;
  ctx: { niche: string; service: string; brandName: string; positioning: string };
  devPrompt: string | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState<WebsiteContent | null>(initialContent);
  const [regeneratingField, setRegeneratingField] = useState<keyof WebsiteContent | null>(
    null
  );
  // In dev mode, per-section regenerate re-opens the paste panel; the parsed
  // full-site response supplies just the one field being regenerated.
  const [devRegenField, setDevRegenField] = useState<keyof WebsiteContent | null>(null);
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

  // Dev mode, no site yet: the pasted response IS the first generation.
  if (!content || !websiteId) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center px-8 py-6">
          <Link href="/" className="text-body font-medium text-text-primary">
            {brandName}
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-6">
          {devPrompt ? (
            <DevAiStep
              touchpoint="website"
              title="Website generation"
              prompt={devPrompt}
              onResult={async (parsed) => {
                await createDevWebsite(agencyId, brandName, parsed as WebsiteContent);
                router.refresh();
              }}
            />
          ) : (
            <p className="text-body-lg text-text-secondary">
              Something went wrong loading your website. Head back and try again.
            </p>
          )}
        </main>
      </div>
    );
  }

  function handleFieldChange(field: keyof WebsiteContent, value: string) {
    setContent((prev) =>
      prev
        ? field === "solutionSteps"
          ? { ...prev, solutionSteps: JSON.parse(value) }
          : { ...prev, [field]: value }
        : prev
    );
  }

  async function handleFieldBlur(field: keyof WebsiteContent) {
    if (!content || !websiteId) return;
    const value =
      field === "solutionSteps" ? JSON.stringify(content.solutionSteps) : (content[field] as string);
    await saveSection(websiteId, field, value);
    setSavedField(field);
    setTimeout(() => setSavedField(null), 1500);
  }

  async function handleRegenerate(field: keyof WebsiteContent) {
    if (devPrompt) {
      setDevRegenField(field);
      return;
    }
    if (!websiteId) return;
    setRegeneratingField(field);
    const fresh = await regenerateSection(websiteId, field, ctx);
    setContent((prev) => (prev ? { ...prev, [field]: fresh } : prev));
    setRegeneratingField(null);
  }

  async function applyDevRegen(parsed: WebsiteContent) {
    if (!devRegenField || !websiteId) return;
    const field = devRegenField;
    const freshValue = parsed[field];
    setContent((prev) => (prev ? { ...prev, [field]: freshValue } : prev));
    await saveSection(
      websiteId,
      field,
      field === "solutionSteps" ? JSON.stringify(freshValue) : (freshValue as string)
    );
    setDevRegenField(null);
  }

  const checks: PreflightCheck[] = runPreflight(content);
  const allPassed = checks.every((c) => c.passed);

  async function handleGoLive() {
    if (!websiteId) return;
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

      <p className="text-small text-text-secondary text-center border-b border-border py-3 px-8">
        Click any section to edit it. Use Regenerate below each one if you want a different version.
      </p>

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

      {devRegenField && devPrompt && (
        <div className="fixed inset-0 bg-text-primary/20 flex items-center justify-center px-6 overflow-auto py-8">
          <div className="flex flex-col gap-2 max-w-[720px] w-full">
            <DevAiStep
              touchpoint="website"
              title={`Regenerate: ${devRegenField}`}
              prompt={devPrompt}
              onResult={(parsed) => applyDevRegen(parsed as WebsiteContent)}
            />
            <Button
              variant="text"
              onClick={() => setDevRegenField(null)}
              className="self-center"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

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
