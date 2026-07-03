import { HTMLAttributes } from "react";

/**
 * The one surface shape in the whole system — Mission Control's card and Ask
 * Omnio's message bubbles share this so the product reads as one thing.
 * 07_VISUAL_DESIGN_SYSTEM.md §11.
 */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface rounded-md shadow-resting ${className}`}
      {...props}
    />
  );
}
