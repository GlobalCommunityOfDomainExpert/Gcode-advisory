"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GuestShell } from "@/components/layout";

/** The signed-out frame for public pages. A client component only because the navbar buttons need the router. */
export function PublicFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <GuestShell onSignIn={() => router.push("/sign-in")} onRegister={() => router.push("/sign-up")}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
    </GuestShell>
  );
}
