import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: BadgeSize;
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: "h-5 px-2",
  md: "h-6 px-2.5",
};

// Always a solid, fully-saturated fill. "neutral" is navy, not grey or red: the brand red sits almost on top of
// "danger" in hue, so a red neutral badge would read as an error.
const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-primary text-white",
  primary: "bg-primary text-white",
  success: "bg-success text-white",
  warning: "bg-warning text-text-primary",
  danger: "bg-danger text-white",
};

export function Badge({ tone = "neutral", size = "md", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "text-small inline-flex items-center justify-center rounded-sm leading-none font-medium",
        toneClasses[tone],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
