import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAiDevMode, DEV_USER } from "@/lib/ai/dev-mode";

type SessionUser = { id: string; email: string };

// The one guard every guided screen calls before touching agency data —
// same "single source of truth" discipline as lib/journey.ts's stage guard.
// In dev mode (local-only, temporary) it returns a fixed local user so the
// journey can be walked without a magic-link round-trip.
export async function requireUser(): Promise<SessionUser> {
  if (isAiDevMode()) {
    return { id: DEV_USER.id, email: DEV_USER.email };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  return { id: user.id, email: user.email };
}
