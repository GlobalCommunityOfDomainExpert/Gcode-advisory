import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

/** Multi-line text for bios, pitches and reasons. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ error = false, rows = 4, className, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    aria-invalid={error || undefined}
    className={cn(
      "text-body text-text-primary placeholder:text-text-secondary w-full rounded-sm border px-4 py-2 shadow-inner transition-colors",
      "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
      "disabled:bg-bg-light disabled:cursor-not-allowed disabled:opacity-50",
      error
        ? "border-danger focus-visible:ring-danger"
        : "bg-surface-light border-border-light hover:border-border-hover focus-visible:border-primary focus-visible:ring-primary",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
