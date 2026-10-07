import { Avatar, Badge, BadgeTone } from "@/components/atoms";
import { cn } from "@/lib/cn";

export interface ProfileHeaderBadge {
  label: string;
  tone?: BadgeTone;
}

export interface ProfileHeaderProps {
  /** Defaults to the first letters of `name`. */
  avatarInitials?: string;
  avatarSrc?: string;
  name: string;
  subtitle?: string;
  badges?: ProfileHeaderBadge[];
  className?: string;
}

export function ProfileHeader({
  avatarInitials,
  avatarSrc,
  name,
  subtitle,
  badges = [],
  className,
}: ProfileHeaderProps) {
  return (
    <div
      className={cn(
        "bg-surface-light ring-primary/10 flex flex-col gap-4 rounded-lg p-6 shadow-sm ring-1 sm:flex-row sm:items-center",
        className,
      )}
    >
      <Avatar alt={name} initials={avatarInitials} src={avatarSrc} size="lg" />
      <div className="min-w-0 flex-1">
        <h2 className="text-large text-text-primary font-bold">{name}</h2>
        {subtitle && (
          <p className="text-body text-text-secondary">{subtitle}</p>
        )}
          <div className="mt-2 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge
                key={badge.label}
                tone={badge.tone ?? "primary"}
                size="sm"
              >
                {badge.label}
              </Badge>
            ))}
          </div>
      </div>
    </div>
  );
}
