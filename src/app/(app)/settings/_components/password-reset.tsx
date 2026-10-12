"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/atoms";
import { Banner } from "@/components/molecules";
import { ValueLine } from "@/components/domain";
import { postAuth } from "@/lib/auth/client";

/**
 * Changing a password goes through the same emailed link as "Forgot password", so there is one way in and nothing new to
 * secure. The link is built on the server from our own address, never from the browser.
 */
export function PasswordReset({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setState("sending");
    setError(null);
    const res = await postAuth("forgot-password", { email });
    if (!res.ok) {
      setState("idle");
      setError(res.error ?? "Something went wrong. Please try again.");
      return;
    }
    setState("sent");
  }

  return (
    <div className="space-y-3">
      <ValueLine
        text="••••••••••"
        sub="We email you a secure link to set a new one."
        action={
          <Button type="button" variant="outline" size="sm" loading={state === "sending"} disabled={state === "sent"} onClick={send}>
            <Mail className="size-4" aria-hidden="true" /> {state === "sent" ? "Link sent" : "Email me a reset link"}
          </Button>
        }
      />
      {state === "sent" && <Banner tone="success">We’ve sent a link to {email}. It may take a minute to arrive.</Banner>}
      {error && (
        <Banner tone="danger" onDismiss={() => setError(null)}>
          {error}
        </Banner>
      )}
    </div>
  );
}
