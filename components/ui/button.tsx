import { ButtonHTMLAttributes } from "react";

/**
 * Two variants only, per 07_VISUAL_DESIGN_SYSTEM.md §11 — a third button
 * style is how a system stops enforcing one primary action per screen.
 */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "text";
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md text-body font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-pine hover:bg-pine-hover text-white px-6 py-3 shadow-resting hover:shadow-raised"
      : "text-text-secondary hover:text-text-primary px-2 py-1";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
