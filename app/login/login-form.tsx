"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sendMagicLink } from "./actions";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              <p className="text-body-lg text-text-secondary">
                Enter your email and we&apos;ll send you a link to sign in — no password
                needed.
              </p>
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
