"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  draftStatusUpdateForClient,
  draftTestimonialAskForClient,
  markTestimonialRequested,
  toggleChecklistItem,
} from "./actions";
import type { ChecklistItem } from "@/lib/ai/delivery";

export function DeliverClient({
  clientId,
  leadName,
  checklist,
  testimonialRequestedAt,
}: {
  clientId: string;
  leadName: string;
  checklist: ChecklistItem[];
  testimonialRequestedAt: Date | null;
}) {
  const [items, setItems] = useState(checklist);
  const [statusDraft, setStatusDraft] = useState<string | null>(null);
  const [isDraftingStatus, setIsDraftingStatus] = useState(false);
  const [testimonialDraft, setTestimonialDraft] = useState<string | null>(null);
  const [isDraftingTestimonial, setIsDraftingTestimonial] = useState(false);
  const [isMarkingRequested, setIsMarkingRequested] = useState(false);

  const allDone = items.length > 0 && items.every((i) => i.done);

  async function handleToggle(index: number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, done: !item.done } : item))
    );
    await toggleChecklistItem(clientId, index);
  }

  async function handleDraftStatus() {
    setIsDraftingStatus(true);
    const message = await draftStatusUpdateForClient(clientId);
    setStatusDraft(message);
    setIsDraftingStatus(false);
  }

  async function handleDraftTestimonial() {
    setIsDraftingTestimonial(true);
    const message = await draftTestimonialAskForClient(clientId);
    setTestimonialDraft(message);
    setIsDraftingTestimonial(false);
  }

  async function handleMarkRequested() {
    setIsMarkingRequested(true);
    await markTestimonialRequested(clientId);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
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
    </div>
  );
}
