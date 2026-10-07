"use client";

import { ReactNode } from "react";
import { useControllableState } from "@/hooks/use-controllable-state";

export interface ToggleGroupOption {
  value: string;
  /** Text or markup (e.g. a count badge). */
  label: ReactNode;
}

export interface ToggleGroupProps {
  options: ToggleGroupOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
}

export function ToggleGroup({
  options,
  value,
  defaultValue,
  onChange,
  ariaLabel = "View",
}: ToggleGroupProps) {
  const [active, select] = useControllableState(
    value,
    defaultValue ?? options[0]?.value,
    onChange,
  );

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="border-border-light bg-bg-light inline-flex max-w-full overflow-x-auto rounded-sm border p-1"
    >
      {options.map((option) => {
        const isActive = option.value === active;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => select(option.value)}
            className={`text-small focus-visible:ring-primary inline-flex shrink-0 items-center rounded-sm px-3 py-1.5 font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
              isActive
                ? "bg-surface-light text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
