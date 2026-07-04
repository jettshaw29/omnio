"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JourneyHeader } from "@/components/journey-header";
import { DevAiStep } from "@/components/dev-ai-step";
import {
  draftStatusUpdateForClient,
  draftTestimonialAskForClient,
  getStatusUpdateDevPrompt,
  getTestimonialDevPrompt,
  markTestimonialRequested,
  saveDevChecklist,
  toggleChecklistItem,
} from "./actions";
import type { ChecklistItem } from "@/lib/ai/delivery";

export function DeliverClient({
  clientId,
  brandName,
  leadName,
  checklist,
  testimonialRequestedAt,
  devMode,
  devChecklistPrompt,
}: {
  clientId: string;
  brandName: string | null;
  leadName: string;
  checklist: ChecklistItem[] | null;
  testimonialRequestedAt: Date | null;
  devMode: boolean;
  devChecklistPrompt: string | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[] | null>(checklist);
  const [statusDraft, setStatusDraft] = useState<string | null>(null);
  const [statusDevPrompt, setStatusDevPrompt] = useState<string | null>(null);
  const [isDraftingStatus, setIsDraftingStatus] = useState(false);
  const [testimonialDraft, setTestimonialDraft] = useState<string | null>(null);
  const [testimonialDevPrompt, setTestimonialDevPrompt] = useState<string | null>(null);
  const [isDraftingTestimonial, setIsDraftingTestimonial] = useState(false);
  const [isMarkingRequested, setIsMarkingRequested] = useState(false);

  // Dev mode, no checklist yet: the pasted response IS the generation.
  if (!items) {
    return (
      <div className="min-h-screen flex flex-col">
        <JourneyHeader brandName={brandName} />
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          {devChecklistPrompt ? (
            <DevAiStep
              touchpoint="checklist"
              title="Delivery checklist"
              prompt={devChecklistPrompt}
              onResult={async (parsed) => {
                await saveDevChecklist(clientId, parsed as ChecklistItem[]);
                router.refresh();
              }}
            />
          ) : (
            <p className="text-body-lg text-text-secondary">
              Something went wrong loading the checklist. Head back and try again.
            </p>
          )}
        </main>
      </div>
    );
  }

  const allDone = items.length > 0 && items.every((i) => i.done);

  async function handleToggle(index: number) {
    setItems((prev) =>
      prev ? prev.map((item, i) => (i === index ? { ...item, done: !item.done } : item)) : prev
    );
    await toggleChecklistItem(clientId, index);
  }

  async function handleDraftStatus() {
    setIsDraftingStatus(true);
    if (devMode) {
      setStatusDraft(null);
      setStatusDevPrompt(await getStatusUpdateDevPrompt(clientId));
      setIsDraftingStatus(false);
      return;
    }
    const message = await draftStatusUpdateForClient(clientId);
    setStatusDraft(message);
    setIsDraftingStatus(false);
  }

  async function handleDraftTestimonial() {
    setIsDraftingTestimonial(true);
    if (devMode) {
      setTestimonialDraft(null);
      setTestimonialDevPrompt(await getTestimonialDevPrompt(clientId));
      setIsDraftingTestimonial(false);
      return;
    }
    const message = await draftTestimonialAskForClient(clientId);
    setTestimonialDraft(message);
    setIsDraftingTestimonial(false);
  }

  async function handleMarkRequested() {
    setIsMarkingRequested(true);
    await markTestimonialRequested(clientId);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <JourneyHeader brandName={brandName} />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-[640px] w-full flex flex-col gap-6">
        <Card className="p-8 flex flex-col gap-6">
          <h1 className="text-h1 font-semibold text-text-primary">
            Deliver {leadName.split(" ")[0]}&apos;s project.
          </h1>

          <div className="flex flex-col gap-3">
            {items.map((item, i) => (
              <label key={item.label} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => handleToggle(i)}
                  className="w-5 h-5 accent-[var(--color-pine)]"
                />
                <span
                  className={`text-body-lg ${
                    item.done ? "text-text-tertiary line-through" : "text-text-primary"
                  }`}
                >
                  {item.label}
                </span>
              </label>
            ))}
          </div>

          <div>
            <Button
              variant="text"
              onClick={handleDraftStatus}
              disabled={isDraftingStatus}
              className="self-start"
            >
              {isDraftingStatus ? "Thinking..." : "Draft Status Update"}
            </Button>
            {statusDevPrompt && !statusDraft && (
              <div className="mt-2">
                <DevAiStep
                  touchpoint="statusUpdate"
                  title="Status update"
                  prompt={statusDevPrompt}
                  onResult={(parsed) => {
                    setStatusDraft(parsed as string);
                    setStatusDevPrompt(null);
                  }}
                />
              </div>
            )}
            {statusDraft && (
              <div className="mt-2 bg-background border border-border rounded-md p-4">
                <p className="text-body text-text-primary whitespace-pre-wrap">{statusDraft}</p>
              </div>
            )}
          </div>
        </Card>

        {allDone && (
          <Card className="p-8 flex flex-col gap-4">
            <h2 className="text-h2 font-semibold text-text-primary">
              Ask {leadName.split(" ")[0]} for a testimonial.
            </h2>
            <p className="text-body-lg text-text-secondary">
              The best time to ask is right now, while the win is still fresh.
            </p>

            {testimonialRequestedAt ? (
              <p className="text-body text-pine">Already asked ✓</p>
            ) : (
              <>
                <Button
                  variant="text"
                  onClick={handleDraftTestimonial}
                  disabled={isDraftingTestimonial}
                  className="self-start"
                >
                  {isDraftingTestimonial ? "Thinking..." : "Draft the Ask"}
                </Button>
                {testimonialDevPrompt && !testimonialDraft && (
                  <DevAiStep
                    touchpoint="testimonial"
                    title="Testimonial ask"
                    prompt={testimonialDevPrompt}
                    onResult={(parsed) => {
                      setTestimonialDraft(parsed as string);
                      setTestimonialDevPrompt(null);
                    }}
                  />
                )}
                {testimonialDraft && (
                  <div className="bg-background border border-border rounded-md p-4">
                    <p className="text-body text-text-primary whitespace-pre-wrap">
                      {testimonialDraft}
                    </p>
                  </div>
                )}
                <Button
                  variant="primary"
                  onClick={handleMarkRequested}
                  disabled={isMarkingRequested}
                  className="self-start"
                >
                  {isMarkingRequested ? "Saving..." : "Mark as Requested"}
                </Button>
              </>
            )}
          </Card>
        )}
      </div>
      </main>
    </div>
  );
}
