"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/layout";

/**
 * The auth modal as a route. There is no public page behind it, so closing goes to sign-in; on sign-in itself
 * (`closeTo` omitted) there is nowhere to go and closing does nothing.
 */
export function AuthDialog({ title, subtitle, closeTo, children }: { title: string; subtitle: string; closeTo?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <AuthModal title={title} subtitle={subtitle} onClose={() => closeTo && router.push(closeTo)}>
      {children}
    </AuthModal>
  );
}

export const linkClasses = "text-primary text-body focus-visible:ring-primary rounded-sm font-bold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
