"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/atoms";
import { Banner, FormField } from "@/components/molecules";
import { postAuth } from "@/lib/auth/client";
import { linkClasses } from "./auth-dialog";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await postAuth("forgot-password", { email });
    setSubmitting(false);
    if (!res.ok) return setError(res.error ?? null);
    setSent(true);
  }

  return (
    <div className="space-y-4">
      {sent ? (
        <Banner tone="success">If that email has a GCODE account, we’ve sent a link to reset the password. It expires in 10 minutes.</Banner>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField label="Email" htmlFor="fp-email" required>
            <Input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" maxLength={254} required />
          </FormField>
          {error && (
            <p role="alert" className="text-small text-danger">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" loading={submitting} disabled={email.trim() === ""}>
            Send reset link
          </Button>
        </form>
      )}
      <p className="text-body text-center">
        <Link href="/sign-in" className={linkClasses}>
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
