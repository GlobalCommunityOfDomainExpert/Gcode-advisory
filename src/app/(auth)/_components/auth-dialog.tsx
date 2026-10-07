"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/layout";

/** The auth modal as a route: closing it returns to the home page. */
export function AuthDialog({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <AuthModal title={title} subtitle={subtitle} onClose={() => router.push("/")}>
      {children}
    </AuthModal>
  );
}

export const linkClasses = "text-primary text-body focus-visible:ring-primary rounded-sm font-bold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
