import { HTMLAttributes } from "react";

export type SpinnerVariant = "circle" | "dots";
export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SpinnerVariant;
  size?: SpinnerSize;
  label?: string;
}

const circleSizeClasses: Record<SpinnerSize, string> = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-[3px]",
};

const dotSizeClasses: Record<SpinnerSize, string> = {
  sm: "size-1",
  md: "size-1.5",
  lg: "size-2",
};

export function Spinner({
  variant = "circle",
  size = "md",
  label = "Loading...",
  className = "",
  ...props
}: SpinnerProps) {
  return (
    <div role="status" aria-live="polite" className={className} {...props}>
      {variant === "circle" ? (
        <div
          className={`${circleSizeClasses[size]} animate-spin rounded-full border-current border-t-transparent`}
        />
      ) : (
        <div className="flex items-center gap-1">
          <span
            className={`${dotSizeClasses[size]} animate-bounce rounded-full bg-current [animation-delay:-0.3s]`}
          />
          <span
            className={`${dotSizeClasses[size]} animate-bounce rounded-full bg-current [animation-delay:-0.15s]`}
          />
          <span
            className={`${dotSizeClasses[size]} animate-bounce rounded-full bg-current`}
          />
        </div>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}
