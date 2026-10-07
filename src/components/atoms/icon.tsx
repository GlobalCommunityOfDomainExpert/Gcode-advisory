import { LucideIcon } from "lucide-react";

export type IconSize = "sm" | "md" | "lg";

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  label?: string;
  className?: string;
}

const sizeClasses: Record<IconSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

export function Icon({
  icon: LucideIconComponent,
  size = "md",
  label,
  className = "",
}: IconProps) {
  return (
    <LucideIconComponent
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      className={`shrink-0 ${sizeClasses[size]} ${className}`}
    />
  );
}
