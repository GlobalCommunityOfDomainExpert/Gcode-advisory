import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/session";
import { getTicket } from "@/lib/server/ticket";
import { maskEmail } from "@/lib/auth/validators";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { SignUpFlow } from "../_components/sign-up-flow";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const redirectTo = safeRedirect((await searchParams).redirect);
  if (await getSession()) redirect(redirectTo);

  // The signed ticket says how far this person got, so a refresh resumes at the right step.
  const ticket = await getTicket();
  return (
    <SignUpFlow
      initialStep={ticket ? (ticket.stage === "verified" ? 2 : 1) : 0}
      initialMaskedEmail={ticket ? maskEmail(ticket.email) : ""}
      redirectTo={redirectTo}
    />
  );
}
