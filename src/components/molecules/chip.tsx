import { ButtonHTMLAttributes } from "react";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({
  selected = false,
  disabled,
  className = "",
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      className={
        `text-small inline-flex items-center rounded-full border px-3 py-1 font-medium transition-colors ` +
        `focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ` +
        `hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ` +
        (selected
          ? "border-secondary bg-secondary text-white"
          : "border-border-light bg-surface-light text-text-primary hover:bg-bg-light") +
        ` ${className}`
      }
      {...props}
    >
      {children}
    </button>
  );
}
