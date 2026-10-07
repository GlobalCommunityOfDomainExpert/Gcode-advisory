"use client";

import { Check, X } from "lucide-react";
import { Progress, ProgressTone } from "@/components/atoms";
import { PASSWORD_RULES, passwordScore } from "@/lib/auth/password-rules";

export interface PasswordStrengthMeterProps {
  password: string;
}

function strengthFor(score: number): { label: string; tone: ProgressTone } {
  if (score >= 5) return { label: "Strong", tone: "success" };
  if (score >= 3) return { label: "Medium", tone: "warning" };
  return { label: "Weak", tone: "danger" };
}

/** Live strength bar and rule checklist under a new-password field. The server re-checks the same rules. */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const score = passwordScore(password);
  const { label, tone } = strengthFor(score);

  return (
    <div className="flex flex-col gap-2">
      <Progress value={score} max={PASSWORD_RULES.length} tone={tone} label={`Password strength: ${label}`} />
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.label} className={`text-small flex items-center gap-1.5 ${met ? "text-success" : "text-text-secondary"}`}>
              {met ? <Check className="size-3.5 shrink-0" aria-hidden="true" /> : <X className="size-3.5 shrink-0" aria-hidden="true" />}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
