import type { Metadata } from "next";
import { isResetToken } from "@/lib/auth/validators";
import { AuthDialog } from "../_components/auth-dialog";
import { ResetPasswordForm } from "../_components/reset-password-form";

export const metadata: Metadata = { title: "Reset password", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthDialog title="Reset Password" subtitle="Choose a new, secure password">
      <ResetPasswordForm token={isResetToken(token) ? token : null} />
    </AuthDialog>
  );
}
