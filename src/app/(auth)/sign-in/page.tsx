import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/session";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { AuthDialog } from "../_components/auth-dialog";
import { SignInForm } from "../_components/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const redirectTo = safeRedirect((await searchParams).redirect);
  if (await getSession()) redirect(redirectTo);

  return (
    <AuthDialog title="Welcome Back" subtitle="Sign in to your GCODE account">
      <SignInForm redirectTo={redirectTo} />
    </AuthDialog>
  );
}
