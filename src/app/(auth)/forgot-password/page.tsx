import type { Metadata } from "next";
import { AuthDialog } from "../_components/auth-dialog";
import { ForgotPasswordForm } from "../_components/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthDialog closeTo="/sign-in" title="Forgot Password" subtitle="Enter your email and we’ll send you a link to reset it">
      <ForgotPasswordForm />
    </AuthDialog>
  );
}
