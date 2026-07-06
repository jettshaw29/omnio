"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { sendMagicLink } from "./actions";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setIsGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
  }

  async function handleSend() {
    if (!email.trim()) return;
    setIsSending(true);
    setError(null);
    const result = await sendMagicLink(email.trim());
    setIsSending(false);
    if (result.error) {
      setError("We couldn't send that. Let's try again.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center px-8 py-6">
        <span className="text-body font-medium text-text-primary">Omnio</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <Card className="max-w-[480px] w-full p-8 flex flex-col gap-6">
          {sent ? (
            <>
              <h1 className="text-h1 font-semibold text-text-primary">Check your email.</h1>
              <p className="text-body-lg text-text-secondary">
                We sent a link to {email} — click it and you&apos;re in. No password to
                remember.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-h1 font-semibold text-text-primary">
                Let&apos;s build your agency.
              </h1>

              <button
                onClick={handleGoogle}
                disabled={isGoogleLoading}
                className="flex items-center justify-center gap-3 w-full border border-border rounded-md py-3 px-4 text-body text-text-primary bg-surface hover:bg-background transition-colors disabled:opacity-50"
              >
                <GoogleIcon />
                {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-small text-text-tertiary">or</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-small font-medium text-text-primary">Email</span>
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="you@example.com"
                  className="text-body-lg text-text-primary bg-surface border border-border rounded-md p-4 focus:outline-none focus:ring-2 focus:ring-pine"
                />
              </label>
              {error && <p className="text-body text-clay">{error}</p>}
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={!email.trim() || isSending}
                className="self-start"
              >
                {isSending ? "Sending..." : "Send me a login link"}
              </Button>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
