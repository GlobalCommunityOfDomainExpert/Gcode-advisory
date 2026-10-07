import { InputHTMLAttributes, forwardRef } from "react";

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  label?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, className = "", id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className="text-body text-text-primary inline-flex cursor-pointer items-center gap-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
      >
        <input
          id={id}
          type="radio"
          ref={ref}
          className={`border-border-light accent-primary focus-visible:ring-primary size-5 shrink-0 border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {label}
      </label>
    );
  },
);

Radio.displayName = "Radio";
