"use client";

import { HTMLAttributes, useState } from "react";
import { Camera } from "lucide-react";
import { initials as getInitials } from "@/lib/initials";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "away";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt: string;
  /** Falls back to the first letters of `alt` (max two). */
  initials?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  /** Overrides the fallback initials background (e.g. a per-attendee generated color). */
  bgColor?: string;
  /** `xl` only: shows a camera button to change the photo. */
  onUpload?: () => void;
  /** Replaces the size utilities (e.g. `size-11` or `size-24`) for sizes outside the scale. */
  sizeClassName?: string;
  /** Extra classes for the photo/initials circle itself (e.g. a ring or shadow). */
  fillClassName?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "size-8 text-small",
  md: "size-10 text-body",
  lg: "size-12 text-large",
  xl: "size-20 text-heading",
};

const statusClasses: Record<AvatarStatus, string> = {
  online: "bg-success",
  offline: "bg-text-secondary",
  away: "bg-warning",
};

const statusLabel: Record<AvatarStatus, string> = {
  online: "Online",
  offline: "Offline",
  away: "Away",
};

export function Avatar({
  src,
  alt,
  initials,
  size = "md",
  status,
  bgColor,
  onUpload,
  sizeClassName,
  fillClassName = "",
  className = "",
  ...props
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const xl = size === "xl";

  return (
    <div className={`relative ${xl ? "" : "inline-flex"} shrink-0 ${sizeClassName ?? sizeClasses[size]} ${className}`} {...props}>
      {/* The initials sit underneath the photo, so a missing or failed image degrades to the initials avatar. */}
      <span
        className={`${bgColor ? "text-white" : "bg-bg-light text-text-secondary"} relative grid size-full shrink-0 place-items-center overflow-hidden ${
          xl ? "ring-surface-light font-bold shadow-md ring-4" : "font-medium"
        } rounded-full ${fillClassName}`}
        style={bgColor ? { backgroundColor: bgColor } : undefined}
      >
        <span aria-hidden="true">{initials ?? getInitials(alt)}</span>
        {src && !failed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-cover"
          />
        )}
      </span>
      {xl && onUpload && (
        <button
          type="button"
          onClick={onUpload}
          aria-label="Upload photo"
          className="bg-primary hover:bg-primary-hover focus-visible:ring-primary ring-surface-light absolute -right-0.5 -bottom-0.5 grid size-7 place-items-center rounded-full text-white ring-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Camera className="size-3.5" aria-hidden="true" />
        </button>
      )}
      {status && (
        <span
          role="img"
          aria-label={statusLabel[status]}
          className={`ring-surface-light absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ${statusClasses[status]}`}
        />
      )}
    </div>
  );
}
