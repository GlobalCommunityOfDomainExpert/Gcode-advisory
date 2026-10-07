import { LucideIcon } from "lucide-react";
import { Icon } from "@/components/atoms";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/ui";

export interface SelectableCardProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  selected?: boolean;
  onSelect?: () => void;
  /** Greyed out and not clickable. */
  disabled?: boolean;
  className?: string;
}

/** Big radio-style choice ("Who are you?"). Use inside a `role="radiogroup"` container. */
export function SelectableCard({
  icon,
  title,
  subtitle,
  selected = false,
  onSelect,
  disabled = false,
  className,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-2 rounded-md border-2 p-6 text-center transition-colors",
        focusRing,
        disabled
          ? "border-border-light bg-bg-light cursor-not-allowed opacity-60"
          : selected
            ? "border-primary bg-primary-light cursor-pointer"
            : "border-border-light bg-surface-light hover:border-border-hover cursor-pointer",
        className,
      )}
    >
      {icon && <Icon icon={icon} size="lg" className={selected ? "text-primary" : "text-text-secondary"} />}
      <span className="text-body text-text-primary font-semibold">{title}</span>
      {subtitle && <span className="text-small text-text-secondary">{subtitle}</span>}
    </button>
  );
}
