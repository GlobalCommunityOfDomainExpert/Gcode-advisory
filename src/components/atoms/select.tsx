import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

/** Native dropdown with the same field chrome as `Input`. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ error = false, className, children, ...props }, ref) => (
  <select
    ref={ref}
    aria-invalid={error || undefined}
    className={cn(
      "text-body text-text-primary h-11 w-full rounded-sm border px-4 transition-colors",
      "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
      "disabled:bg-bg-light disabled:cursor-not-allowed disabled:opacity-50",
      error
        ? "border-danger focus-visible:ring-danger"
        : "bg-surface-light border-border-light hover:border-border-hover focus-visible:border-primary focus-visible:ring-primary",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = "Select";
