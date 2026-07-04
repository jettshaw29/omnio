import Link from "next/link";
import { signOut } from "@/lib/auth-actions";

/**
 * The one way back to Mission Control from any guided screen — not
 * navigation (no menu, no tabs, no links to other stages), just the
 * identity mark doubling as home, the same way it already worked on Mission
 * Control and Website Builder. This is what lets "avoid traditional SaaS
 * navigation" and "the user should always know how to get back" both hold
 * at once (01_MISSION_CONTROL_UX.md §2). Sign out is the one account-level
 * utility, quiet and secondary, not a competing action.
 */
export function JourneyHeader({ brandName }: { brandName: string | null }) {
  return (
    <header className="flex items-center justify-between px-8 py-6">
      <Link href="/" className="text-body font-medium text-text-primary">
        {brandName ?? "Omnio"}
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="text-small text-text-secondary hover:text-text-primary transition-colors"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
