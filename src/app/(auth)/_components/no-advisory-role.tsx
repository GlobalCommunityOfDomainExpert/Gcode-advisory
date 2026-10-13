"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { postAuth } from "@/lib/auth/client";

/**
 * Shown to someone who is signed in but whose account has none of the four Advisory roles (for example an account made on Events for
 * another purpose). Without this page, /dashboard sent them to /sign-up and /sign-up sent them straight back: an endless loop.
 */
export function NoAdvisoryRole({ email, roleName }: { email?: string; roleName: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function signOut() {
    setBusy(true);
    await postAuth("sign-out", {});
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 text-center">
      <h1 className="text-heading font-extrabold">This account can’t use Advisory yet</h1>
      <p className="text-body text-text-secondary mt-3">
        {email ? <span className="text-text-primary font-medium">{email}</span> : "This account"} is signed in, but its role
        {roleName && roleName !== "NONE" ? ` (${roleName})` : ""} is not one of the Advisory roles: Domain Expert, Intern, Startup or Institution.
      </p>
      <p className="text-small text-text-secondary mt-3">Sign out and use an account with one of those roles, or contact support to have a role added to this one.</p>
      <Button className="mt-6" loading={busy} onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}
