"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banner, FormField, PasswordStrengthMeter } from "@/components/molecules";
import { Button, PasswordInput } from "@/components/atoms";
import { postAuth } from "@/lib/auth/client";
import { isPasswordValid } from "@/lib/auth/password-rules";
import { linkClasses } from "./auth-dialog";

/** `token` comes from the emailed link; the server page only passes it when it has a plausible shape. */
export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // A secret in the address bar ends up in history, screenshots and Referer headers. The page keeps the token in
  // memory (props) and removes it from the URL straight away.
  useEffect(() => {
    if (token) window.history.replaceState(null, "", window.location.pathname);
  }, [token]);

  if (done) {
    return (
      <div className="space-y-4">
        <Banner tone="success">Password updated. You can sign in with the new password.</Banner>
        <Button className="w-full" onClick={() => router.push("/sign-in")}>
          Sign in
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p role="alert" className="text-body text-danger">
          This reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className={linkClasses}>
          Request a new link
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isPasswordValid(password)) return setError("Password does not meet the requirements below.");
    if (password !== confirm) return setError("Passwords do not match.");
    setSubmitting(true);
    setError(null);
    const res = await postAuth("reset-password", { token, password });
    setSubmitting(false);
    if (!res.ok) return setError(res.error ?? null);
    setPassword("");
    setConfirm("");
    setDone(true);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormField label="New password" htmlFor="rp-pw" required>
        <PasswordInput id="rp-pw" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" autoComplete="new-password" maxLength={128} required />
      </FormField>
      <PasswordStrengthMeter password={password} />
      <FormField label="Confirm new password" htmlFor="rp-confirm" required>
        <PasswordInput id="rp-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat the password" autoComplete="new-password" maxLength={128} required />
      </FormField>
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" loading={submitting} disabled={password === "" || confirm === ""}>
        Reset password
      </Button>
    </form>
  );
}
