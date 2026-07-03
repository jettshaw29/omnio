"use client";

import type { WebsiteContent } from "@/lib/ai/website";
import { Button } from "@/components/ui/button";

/**
 * The ONE agency-website template (00_V1_PRODUCT_SPEC.md §7 non-goal: no
 * page builder). Used in both places per 02_TECH_ARCHITECTURE.md §5 — the
 * Website Builder's live preview (mode="edit") and the public published
 * route (mode="view") render this exact same component, so there is no gap
 * between what's edited and what goes live.
 *
 * Section order follows 03_AI_AGENCY_PLAYBOOK.md §7 exactly. Pricing is
 * rendered from the locked Offer directly, never a separately generated
 * field, so the site can never drift from the real offer.
 */
export function WebsiteTemplate({
  mode,
  content,
  brandName,
  offerService,
  offerPriceCents,
  onFieldChange,
  onFieldBlur,
  onRegenerate,
  regeneratingField,
  revealCount,
}: {
  mode: "edit" | "view";
  content: WebsiteContent;
  brandName: string;
  offerService: string;
  offerPriceCents: number;
  onFieldChange?: (field: keyof WebsiteContent, value: string) => void;
  onFieldBlur?: (field: keyof WebsiteContent) => void;
  onRegenerate?: (field: keyof WebsiteContent) => void;
  regeneratingField?: keyof WebsiteContent | null;
  // Undefined = everything visible (public site, resumed drafts). A number
  // drives the "site assembling" stagger-in on first generation
  // (07_VISUAL_DESIGN_SYSTEM.md §1 — Website Builder's emotional goal is
  // momentum, and this IS the loading state, not a spinner shown before it).
  revealCount?: number;
}) {
  const editable = mode === "edit";
  const price = (offerPriceCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <div className="max-w-[900px] w-full mx-auto flex flex-col gap-16 py-16 px-6">
      <Reveal index={0} revealCount={revealCount}>
        <Section
          field="headline"
          editable={editable}
          regenerating={regeneratingField === "headline"}
          onRegenerate={onRegenerate}
        >
          {editable ? (
            <textarea
              className="w-full text-h1 font-semibold text-text-primary bg-transparent border border-transparent hover:border-border focus:border-pine focus:outline-none rounded-md p-2 -m-2 resize-none"
              value={content.headline}
              rows={2}
              onChange={(e) => onFieldChange?.("headline", e.target.value)}
              onBlur={() => onFieldBlur?.("headline")}
            />
          ) : (
            <h1 className="text-h1 font-semibold text-text-primary">{content.headline}</h1>
          )}
        </Section>
      </Reveal>

      <Reveal index={1} revealCount={revealCount}>
        <div className="flex flex-col gap-6 -mt-8">
          <Section
            field="subheadline"
            editable={editable}
            regenerating={regeneratingField === "subheadline"}
            onRegenerate={onRegenerate}
          >
            {editable ? (
              <input
                className="w-full text-body-lg text-text-secondary bg-transparent border border-transparent hover:border-border focus:border-pine focus:outline-none rounded-md p-2 -m-2"
                value={content.subheadline}
                onChange={(e) => onFieldChange?.("subheadline", e.target.value)}
                onBlur={() => onFieldBlur?.("subheadline")}
              />
            ) : (
              <p className="text-body-lg text-text-secondary">{content.subheadline}</p>
            )}
          </Section>
          <Button variant="primary" className="self-start">
            {content.ctaLabel}
          </Button>
        </div>
      </Reveal>

      <Reveal index={2} revealCount={revealCount}>
        <Section
          field="problem"
          editable={editable}
          regenerating={regeneratingField === "problem"}
          onRegenerate={onRegenerate}
        >
          {editable ? (
            <textarea
              className="w-full text-body-lg text-text-primary bg-transparent border border-transparent hover:border-border focus:border-pine focus:outline-none rounded-md p-2 -m-2 resize-none"
              value={content.problem}
              rows={2}
              onChange={(e) => onFieldChange?.("problem", e.target.value)}
              onBlur={() => onFieldBlur?.("problem")}
            />
          ) : (
            <p className="text-body-lg text-text-primary">{content.problem}</p>
          )}
        </Section>
      </Reveal>

      <Reveal index={3} revealCount={revealCount}>
        <Section
          field="solutionSteps"
          editable={editable}
          regenerating={regeneratingField === "solutionSteps"}
          onRegenerate={onRegenerate}
        >
          <div className="flex flex-col gap-4">
            {content.solutionSteps.map((step, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-h2 font-semibold text-pine">{i + 1}</span>
                {editable ? (
                  <input
                    className="w-full text-body-lg text-text-primary bg-transparent border border-transparent hover:border-border focus:border-pine focus:outline-none rounded-md p-2 -m-2"
                    value={step}
                    onChange={(e) => {
                      const next = [...content.solutionSteps] as [string, string, string];
                      next[i] = e.target.value;
                      onFieldChange?.("solutionSteps", JSON.stringify(next));
                    }}
                    onBlur={() => onFieldBlur?.("solutionSteps")}
                  />
                ) : (
                  <p className="text-body-lg text-text-primary pt-1">{step}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      </Reveal>

      <Reveal index={4} revealCount={revealCount}>
        <Section
          field="proof"
          editable={editable}
          regenerating={regeneratingField === "proof"}
          onRegenerate={onRegenerate}
        >
          {editable ? (
            <textarea
              className="w-full text-body text-text-secondary bg-transparent border border-transparent hover:border-border focus:border-pine focus:outline-none rounded-md p-2 -m-2 resize-none"
              value={content.proof}
              rows={2}
              onChange={(e) => onFieldChange?.("proof", e.target.value)}
              onBlur={() => onFieldBlur?.("proof")}
            />
          ) : (
            <p className="text-body text-text-secondary">{content.proof}</p>
          )}
        </Section>
      </Reveal>

      {/* Pricing — derived from the locked Offer, never AI-generated here. */}
      <Reveal index={5} revealCount={revealCount}>
        <div className="flex flex-col gap-2 bg-surface border border-border rounded-md p-8 shadow-resting">
          <span className="text-small text-text-secondary">{brandName}</span>
          <h2 className="text-h2 font-semibold text-text-primary">{offerService}</h2>
          <p className="text-h1 font-semibold text-pine">{price}</p>
        </div>
      </Reveal>

      <Reveal index={6} revealCount={revealCount}>
        <Section
          field="guarantee"
          editable={editable}
          regenerating={regeneratingField === "guarantee"}
          onRegenerate={onRegenerate}
        >
          {editable ? (
            <textarea
              className="w-full text-body-lg text-text-primary bg-transparent border border-transparent hover:border-border focus:border-pine focus:outline-none rounded-md p-2 -m-2 resize-none"
              value={content.guarantee}
              rows={2}
              onChange={(e) => onFieldChange?.("guarantee", e.target.value)}
              onBlur={() => onFieldBlur?.("guarantee")}
            />
          ) : (
            <p className="text-body-lg text-text-primary">{content.guarantee}</p>
          )}
        </Section>
      </Reveal>

      <Reveal index={7} revealCount={revealCount}>
        <Button variant="primary" className="self-center">
          {content.ctaLabel}
        </Button>
      </Reveal>
    </div>
  );
}

function Reveal({
  index,
  revealCount,
  children,
}: {
  index: number;
  revealCount?: number;
  children: React.ReactNode;
}) {
  if (revealCount === undefined) return <>{children}</>;
  const visible = index < revealCount;
  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {children}
    </div>
  );
}

function Section({
  field,
  editable,
  regenerating,
  onRegenerate,
  children,
}: {
  field: keyof WebsiteContent;
  editable: boolean;
  regenerating?: boolean;
  onRegenerate?: (field: keyof WebsiteContent) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {children}
      {editable && (
        <button
          onClick={() => onRegenerate?.(field)}
          disabled={regenerating}
          className="self-start text-small text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
        >
          {regenerating ? "Thinking of a different angle..." : "Regenerate"}
        </button>
      )}
    </div>
  );
}
