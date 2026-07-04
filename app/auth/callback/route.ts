import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exchanges the magic-link code for a real session, then sends the user
// into Mission Control — first-time provisioning happens lazily in
// lib/current-agency.ts, not here, so there's exactly one place that logic
// lives.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
