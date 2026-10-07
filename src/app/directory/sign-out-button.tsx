"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { postAuth } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await postAuth("sign-out", {});
    router.replace("/sign-in");
    router.refresh();
  }

  return (
    <Button variant="secondary" loading={busy} onClick={signOut}>
      Sign out
    </Button>
  );
}
