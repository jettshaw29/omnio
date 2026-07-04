import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The one guard every guided screen calls before touching agency data —
// same "single source of truth" discipline as lib/journey.ts's stage guard.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
