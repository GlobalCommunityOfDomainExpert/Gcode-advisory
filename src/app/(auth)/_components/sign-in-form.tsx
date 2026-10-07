"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, PasswordInput } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import { postAuth } from "@/lib/auth/client";
import { linkClasses } from "./auth-dialog";

/** `redirectTo` is already checked by `safeRedirect` on the server. */
export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    const res = await postAuth<{ next: "role" | "app" }>("sign-in", {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
    if (!res.ok) {
      setError(res.error ?? null);
      setSubmitting(false);
      return;
    }
    // Verified but never picked a role: finish the "Who are you?" step. Otherwise go where they were headed.
    router.replace(res.data?.next === "role" ? "/sign-up" : redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormField label="Email" htmlFor="si-email" required>
        <Input id="si-email" name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength={254} required />
      </FormField>
      <FormField label="Password" htmlFor="si-pw" required>
        <PasswordInput id="si-pw" name="password" placeholder="Your password" autoComplete="current-password" maxLength={128} required />
      </FormField>

      <div className="-mt-2 text-right">
        <Link href="/forgot-password" className={`${linkClasses} text-small`}>
          Forgot password?
        </Link>
      </div>

      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" loading={submitting}>
        Sign in
      </Button>

      <p className="text-body text-text-secondary text-center">
        New to GCODE?{" "}
        <Link href="/sign-up" className={linkClasses}>
          Create account
        </Link>
      </p>
    </form>
  );
}
