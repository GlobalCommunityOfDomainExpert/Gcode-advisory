import { LabelHTMLAttributes } from "react";

export type LabelSize = "sm" | "md";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  size?: LabelSize;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
}

const sizeClasses: Record<LabelSize, string> = {
  sm: "text-small",
  md: "text-body",
};

export function Label({
  size = "md",
  required = false,
  disabled = false,
  error = false,
  className = "",
  children,
  ...props
}: LabelProps) {
  return (
    <label
      className={`font-medium ${sizeClasses[size]} ${
        disabled
          ? "text-text-secondary opacity-50"
          : error
            ? "text-danger"
            : "text-text-primary"
      } ${className}`}
      {...props}
    >
      {children}
      {required && (
        <span className="text-danger" aria-hidden="true">
          {" "}
          *
        </span>
      )}
    </label>
  );
}
