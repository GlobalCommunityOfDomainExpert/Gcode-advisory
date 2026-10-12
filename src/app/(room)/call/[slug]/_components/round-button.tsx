"use client";

import type { LucideIcon } from "lucide-react";

/** The round control from the wireframe: white tint when on, red when off, 48px, with a text alternative. */
export function RoundButton({
  on,
  iconOn: IconOn,
  iconOff: IconOff,
  label,
  onClick,
  disabled,
}: {
  on: boolean;
  iconOn: LucideIcon;
  iconOff: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const Icon = on ? IconOn : IconOff;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      aria-label={`${label}${on ? "" : " (off)"}`}
      title={disabled ? `${label} isn’t available here` : label}
      className={`focus-visible:ring-offset-primary grid size-12 place-items-center rounded-full text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
        on ? "bg-white/15 hover:bg-white/25" : "bg-danger hover:bg-danger/90"
      }`}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}
