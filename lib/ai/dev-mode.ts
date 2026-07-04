// TEMPORARY developer mode (see .env AI_DEV_MODE). Lets us validate every AI
// prompt and the whole product flow by hand-relaying prompts to a Claude
// subscription, spending $0 on the API. Deliberately small and self-contained
// so it's trivial to rip out once the prompts are proven and we go live.

export function isAiDevMode(): boolean {
  return process.env.AI_DEV_MODE === "true";
}

// A stable local identity used only when dev mode bypasses login. Our own
// User table is separate from Supabase auth.users, so this needs no real
// auth record — getCurrentAgency just upserts it.
export const DEV_USER = {
  id: "dev-user-local",
  email: "dev@omnio.local",
} as const;

/**
 * Pulls a JSON value out of a hand-pasted Claude response. Real pastes are
 * messy — wrapped in ```json fences, prefixed with "Here's the...", etc. —
 * so this is deliberately forgiving: try the whole thing, then fall back to
 * the first balanced {...} or [...] block.
 */
export function extractJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // fall through to block extraction
  }

  const firstBrace = cleaned.search(/[{[]/);
  if (firstBrace !== -1) {
    const open = cleaned[firstBrace];
    const close = open === "{" ? "}" : "]";
    const lastClose = cleaned.lastIndexOf(close);
    if (lastClose > firstBrace) {
      const block = cleaned.slice(firstBrace, lastClose + 1);
      return JSON.parse(block) as T;
    }
  }

  throw new Error(
    "Couldn't read that as JSON. Paste Claude's full response — it should contain a JSON object."
  );
}
