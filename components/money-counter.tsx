"use client";

import { useEffect, useState } from "react";

/**
 * The one animation reserved for the single most important screen in the
 * product (07_VISUAL_DESIGN_SYSTEM.md §7) — counts from the agency's prior
 * running total up to the current one. Used nowhere else, on purpose.
 */
export function MoneyCounter({ fromCents, toCents }: { fromCents: number; toCents: number }) {
  const [value, setValue] = useState(fromCents);

  useEffect(() => {
    const durationMs = 800;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out
      setValue(Math.round(fromCents + (toCents - fromCents) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fromCents, toCents]);

  const formatted = (value / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  return (
    <p className="text-display font-semibold text-gold tabular-nums" aria-live="polite">
      {formatted}
    </p>
  );
}
