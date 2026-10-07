import { ButtonHTMLAttributes, forwardRef } from "react";
import { Spinner } from "./spinner";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "danger-ghost"
  | "success"
  | "accent"
  | "light"
  | "onDark";

export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm font-bold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary:
    "bg-surface-light text-text-primary border border-border-light hover:bg-bg-light",
  outline:
    "bg-transparent text-primary border border-primary hover:bg-primary-light",
  ghost: "bg-transparent text-primary hover:bg-primary-light",
  danger: "bg-danger text-white hover:bg-danger/90",
  "danger-ghost": "bg-transparent text-danger hover:bg-danger-light",
  success: "bg-success text-white hover:bg-success/90",
  accent: "bg-secondary text-white hover:bg-secondary-hover",
  // On a navy surface (hero band, focus tile): primary and secondary actions.
  light: "bg-white text-primary hover:bg-white/90",
  onDark: "bg-white/10 text-white border border-white/25 hover:bg-white/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-small",
  md: "min-h-11 px-6 text-body",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className = "",
) {
  return `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClasses(variant, size, className)}
        {...props}
      >
        {loading && <Spinner size="sm" className="text-current" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
