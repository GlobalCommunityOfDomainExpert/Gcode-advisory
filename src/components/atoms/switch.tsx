import { InputHTMLAttributes, forwardRef } from "react";

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className = "", id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className="text-body text-text-primary inline-flex cursor-pointer items-center gap-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
      >
        <input
          id={id}
          ref={ref}
          type="checkbox"
          role="switch"
          className={`peer sr-only ${className}`}
          {...props}
        />
        <span className="bg-bg-light peer-checked:bg-primary peer-focus-visible:ring-primary flex h-6 w-11 shrink-0 items-center justify-start rounded-full p-0.5 transition-colors peer-checked:justify-end peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2">
          <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
        </span>
        {label}
      </label>
    );
  },
);

Switch.displayName = "Switch";
