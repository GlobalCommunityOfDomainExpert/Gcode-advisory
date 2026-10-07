"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, GraduationCap, Rocket, User } from "lucide-react";
import { Button, Checkbox, Input, PasswordInput } from "@/components/atoms";
import { FormField, PasswordStrengthMeter, SelectableCard } from "@/components/molecules";
import { postAuth } from "@/lib/auth/client";
import { isPasswordValid } from "@/lib/auth/password-rules";
import { isEmail, maskEmail, normalizeEmail, normalizeFullName, normalizePhone, type SignUpRole } from "@/lib/auth/validators";
import { AuthDialog, linkClasses } from "./auth-dialog";
import { OtpInput } from "./otp-input";

type Step = 0 | 1 | 2;

const TITLES: Record<Step, { title: string; subtitle: string }> = {
  0: { title: "Create Account", subtitle: "Join the GCODE ecosystem today" },
  1: { title: "Verify Your Email", subtitle: "Enter the code we sent you" },
  2: { title: "Who are you?", subtitle: "Tell us how you’ll be using GCODE" },
};

const ROLES: { role: SignUpRole; title: string; subtitle: string; icon: typeof User }[] = [
  { role: "EXPERT", title: "Domain Expert", subtitle: "Share expertise & mentor", icon: User },
  { role: "FRESHER", title: "Fresher / Intern", subtitle: "Learn and grow", icon: GraduationCap },
  { role: "STARTUP", title: "Startup / MSME", subtitle: "Build and scale", icon: Rocket },
  { role: "INSTITUTION", title: "Institution", subtitle: "Partner with GCODE", icon: Building2 },
];

export interface SignUpFlowProps {
  /** Where the server's onboarding ticket says this person is, so a refresh doesn't restart sign-up. */
  initialStep: Step;
  /** Already masked server-side. */
  initialMaskedEmail: string;
  /** Already checked by `safeRedirect` on the server. */
  redirectTo: string;
}

/** Account details → email code → role. Sign-up never gates on profile completion: it ends in the Directory. */
export function SignUpFlow({ initialStep, initialMaskedEmail, redirectTo }: SignUpFlowProps) {
  const [step, setStep] = useState<Step>(initialStep);
  const [maskedEmail, setMaskedEmail] = useState(initialMaskedEmail);

  return (
    <AuthDialog closeTo="/sign-in" {...TITLES[step]}>
      {step === 0 && (
        <DetailsStep
          onDone={(email) => {
            setMaskedEmail(maskEmail(email));
            setStep(1);
          }}
        />
      )}
      {step === 1 && <VerifyStep maskedEmail={maskedEmail} onVerified={() => setStep(2)} onRestart={() => setStep(0)} />}
      {step === 2 && <RoleStep redirectTo={redirectTo} />}
    </AuthDialog>
  );
}

function DetailsStep({ onDone }: { onDone: (email: string) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const valid =
    terms &&
    normalizeFullName(fullName) !== null &&
    isEmail(normalizeEmail(email)) &&
    normalizePhone(phone) !== null &&
    isPasswordValid(password);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    const res = await postAuth("sign-up", { fullName, email, phone, password });
    setSubmitting(false);
    if (!res.ok) return setError(res.error ?? null);
    setPassword("");
    onDone(normalizeEmail(email));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormField label="Full Name" htmlFor="su-name" required>
        <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" autoComplete="name" maxLength={100} required />
      </FormField>
      <FormField label="Email" htmlFor="su-email" required>
        <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" maxLength={254} required />
      </FormField>
      <FormField label="Phone" htmlFor="su-phone" required hint="10-digit mobile number">
        <Input id="su-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" autoComplete="tel-national" maxLength={16} required />
      </FormField>
      <FormField label="Password" htmlFor="su-pw" required>
        <PasswordInput id="su-pw" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" autoComplete="new-password" maxLength={128} required />
      </FormField>
      <PasswordStrengthMeter password={password} />

      <Checkbox id="su-terms" checked={terms} onChange={(e) => setTerms(e.target.checked)} label="I agree to the Terms of Service and Privacy Policy" />

      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" loading={submitting} disabled={!valid}>
        Continue to Verify Email
      </Button>

      <p className="text-body text-text-secondary text-center">
        Already have an account?{" "}
        <Link href="/sign-in" className={linkClasses}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

function VerifyStep({ maskedEmail, onVerified, onRestart }: { maskedEmail: string; onVerified: () => void; onRestart: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    setError(null);
    const res = await postAuth("verify-otp", { code });
    setChecking(false);
    if (!res.ok) {
      // The ticket cookie is gone (expired or cleared): there is nothing to verify against, so start over.
      if (res.status === 401) return onRestart();
      return setError(res.error ?? null);
    }
    onVerified();
  }

  async function startOver() {
    await postAuth("sign-out", {});
    onRestart();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <p className="text-body text-text-secondary text-center">
        Enter the 6-character code sent to <span className="text-text-primary font-medium">{maskedEmail}</span>
      </p>
      <OtpInput error={!!error} disabled={checking} onChange={setCode} />
      {error && (
        <p role="alert" className="text-small text-danger text-center">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" loading={checking} disabled={code.length !== 6}>
        Verify OTP
      </Button>
      <p className="text-small text-text-secondary text-center">
        Wrong email?{" "}
        <button type="button" onClick={startOver} className={linkClasses}>
          Start over
        </button>
      </p>
    </form>
  );
}

function RoleStep({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [role, setRole] = useState<SignUpRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleComplete() {
    if (!role) return;
    setSubmitting(true);
    setError(null);
    const res = await postAuth("select-stakeholder", { role });
    if (!res.ok) {
      setSubmitting(false);
      if (res.status === 401) return router.replace("/sign-in");
      return setError(res.error ?? null);
    }
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Stakeholder type" className="grid grid-cols-2 gap-3">
        {ROLES.map((option) => (
          <SelectableCard
            key={option.role}
            icon={option.icon}
            title={option.title}
            subtitle={option.subtitle}
            selected={role === option.role}
            onSelect={() => setRole(option.role)}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
      <Button className="w-full" loading={submitting} disabled={!role} onClick={handleComplete}>
        Complete Setup
      </Button>
    </div>
  );
}
