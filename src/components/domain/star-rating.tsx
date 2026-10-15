"use client";

import { Star } from "lucide-react";
import { Icon } from "@/components/atoms";

/** Five stars, filled up to `value`. Read-only: the screen reader hears "4 out of 5 stars". */
export function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} icon={Star} size="sm" className={`size-4! ${n <= Math.round(value) ? "text-warning fill-current" : "text-border-hover"}`} />
      ))}
    </span>
  );
}

/** Pick 1 to 5 stars: a radio group, so it works with the keyboard and announces itself. */
export function StarPicker({ value, onChange, label = "Your rating", onDark = false }: { value: number; onChange: (n: number) => void; label?: string; onDark?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="focus-visible:ring-primary rounded-sm p-0.5 focus-visible:ring-2 focus-visible:outline-none"
        >
          <Icon icon={Star} size="md" className={`size-8! transition-colors ${n <= value ? "text-warning fill-current" : onDark ? "text-white/40 hover:text-warning" : "text-border-hover hover:text-warning"}`} />
        </button>
      ))}
    </div>
  );
}
