import { LucideIcon } from "lucide-react";
import { Icon } from "@/components/atoms";

export type IconTileTone = "primary" | "solid" | "success" | "warning" | "danger" | "neutral";
export type IconTileSize = "md" | "lg";

export interface IconTileProps {
  icon: LucideIcon;
  tone?: IconTileTone;
  size?: IconTileSize;
  className?: string;
}

const toneClasses: Record<IconTileTone, string> = {
  primary: "bg-primary-light text-primary",
  solid: "bg-primary text-white",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-danger-light text-danger",
  neutral: "bg-bg-light text-text-secondary",
};

/** The recurring "icon in a soft square" motif (section nav, form headers, feature rows). */
export function IconTile({ icon, tone = "primary", size = "md", className = "" }: IconTileProps) {
  return (
    <span
      className={`grid ${size === "lg" ? "size-11" : "size-9"} shrink-0 place-items-center rounded-sm transition-colors ${toneClasses[tone]} ${className}`}
    >
      <Icon icon={icon} size={size === "lg" ? "md" : "sm"} />
    </span>
  );
}
