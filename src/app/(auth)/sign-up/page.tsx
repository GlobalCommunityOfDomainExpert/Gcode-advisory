import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/session";
import { getTicket } from "@/lib/server/ticket";
import { maskEmail } from "@/lib/auth/validators";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { ROLE_BY_NAME } from "@/lib/profile/types";
import { SignUpFlow } from "../_components/sign-up-flow";
import { NoAdvisoryRole } from "../_components/no-advisory-role";

export const metadata: Metadata = { title: "Create account" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const redirectTo = safeRedirect((await searchParams).redirect);
  const session = await getSession();
  if (session) {
    // a person with an Advisory role has nothing to do here; a person without one must not be bounced back to the app (which bounces them here)
    if (ROLE_BY_NAME[session.roleName]) redirect(redirectTo);
    return <NoAdvisoryRole email={session.email} roleName={session.roleName} />;
  }

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
