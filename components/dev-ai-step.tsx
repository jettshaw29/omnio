"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resolveDevResponse, type DevTouchpoint } from "@/lib/ai/dev-resolver";

/**
 * TEMPORARY dev-mode panel. Where the app would call the paid API, this shows
 * the exact prompt to copy into a Claude subscription, takes the pasted
 * response, parses it, and hands the parsed result back so the journey
 * continues exactly as if the API had answered. Visually flagged as a dev
 * tool so it's never mistaken for product UI.
 */
export function DevAiStep({
  touchpoint,
  prompt,
  title,
  onResult,
}: {
  touchpoint: DevTouchpoint;
  prompt: string;
  title: string;
  onResult: (parsed: unknown) => void;
}) {
  const [raw, setRaw] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleContinue() {
    setIsResolving(true);
    setError(null);
    try {
      const parsed = await resolveDevResponse(touchpoint, raw);
      onResult(parsed);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't read that response. Paste Claude's full reply."
      );
      setIsResolving(false);
    }
  }

  return (
    <div className="max-w-[720px] w-full mx-auto my-8 rounded-md border-2 border-dashed border-clay/50 bg-surface p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-micro uppercase tracking-wide text-clay font-medium">
          Dev mode · {title}
        </span>
        <Button variant="text" onClick={handleCopy}>
          {copied ? "Copied ✓" : "Copy prompt"}
        </Button>
      </div>

      <pre className="text-small text-text-secondary bg-background border border-border rounded-sm p-4 max-h-64 overflow-auto whitespace-pre-wrap font-mono">
        {prompt}
      </pre>

      <label className="flex flex-col gap-2">
        <span className="text-small font-medium text-text-primary">
          Paste Claude&apos;s response
        </span>
        <textarea
          rows={6}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Paste the full response here..."
          className="text-body text-text-primary bg-surface border border-border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-pine resize-none font-mono"
        />
      </label>

      {error && <p className="text-body text-clay">{error}</p>}

      <Button
        variant="primary"
        onClick={handleContinue}
        disabled={!raw.trim() || isResolving}
        className="self-start"
      >
        {isResolving ? "Reading..." : "Continue"}
      </Button>
    </div>
  );
}
