"use server";

import { createClient } from "@/lib/supabase/server";

// Magic-link only, no passwords — a founder-mode call: no reset-password
// flow to build, nothing to get wrong on a phone keyboard, and it matches
// the product's "remove friction" philosophy better than a password field.
export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  return { error: error?.message ?? null };
}
