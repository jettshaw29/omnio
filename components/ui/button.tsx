import { ButtonHTMLAttributes } from "react";
import Link from "next/link";

/**
 * Two variants only, per 07_VISUAL_DESIGN_SYSTEM.md §11 — a third button
 * style is how a system stops enforcing one primary action per screen.
 */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "text";
  // Renders as a real link when provided. Callers that need "no destination
  // yet" to mean disabled (e.g. MissionControlCard) pass disabled explicitly
  // — Button itself has no opinion on that, or every plain onClick button
  // with no href would silently render disabled.
  href?: string;
};

export function Button({
  variant = "primary",
  className = "",
  href,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md text-body font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "bg-pine hover:bg-pine-hover text-white px-6 py-3 shadow-resting hover:shadow-raised"
      : "text-text-secondary hover:text-text-primary px-2 py-1";

  if (href && !disabled) {
    return (
      <Link href={href} className={`${base} ${styles} ${className}`}>
        {props.children}
      </Link>
    );
  }

  return (
    <button disabled={disabled} className={`${base} ${styles} ${className}`} {...props} />
  );
}
