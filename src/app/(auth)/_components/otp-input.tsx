"use client";

import { ChangeEvent, ClipboardEvent, KeyboardEvent, useRef } from "react";
import { OTP_LENGTH } from "@/lib/auth/validators";

export interface OtpInputProps {
  error?: boolean;
  disabled?: boolean;
  onChange?: (code: string) => void;
}

const clean = (v: string) => v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

/** Six boxes: auto-advance, backspace goes back, a pasted code fills them all. */
export function OtpInput({ error = false, disabled = false, onChange }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const emit = () => onChange?.(refs.current.map((el) => el?.value ?? "").join(""));

  function handleChange(event: ChangeEvent<HTMLInputElement>, index: number) {
    const value = clean(event.target.value).slice(-1);
    event.target.value = value;
    if (value && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
    emit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Backspace" && !event.currentTarget.value && index > 0) refs.current[index - 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = clean(event.clipboardData.getData("text")).slice(0, OTP_LENGTH);
    if (!pasted) return;
    pasted.split("").forEach((char, i) => {
      const el = refs.current[i];
      if (el) el.value = char;
    });
    refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    emit();
  }

  return (
    <div role="group" aria-label="6-character verification code" className="grid grid-cols-6 gap-2">
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="text"
          maxLength={1}
          autoFocus={index === 0}
          autoCapitalize="characters"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          aria-label={`Character ${index + 1}`}
          aria-invalid={error || undefined}
          onChange={(event) => handleChange(event, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={handlePaste}
          className={
            "bg-surface-light text-text-primary text-large h-11 w-full min-w-0 rounded-sm border px-0 text-center font-semibold shadow-inner " +
            "transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none " +
            "disabled:bg-bg-light disabled:cursor-not-allowed disabled:opacity-50 " +
            (error
              ? "border-danger focus-visible:ring-danger"
              : "border-border-light hover:border-border-hover focus-visible:border-primary focus-visible:ring-primary")
          }
        />
      ))}
    </div>
  );
}
