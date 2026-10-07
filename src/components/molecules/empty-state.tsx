import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Icon } from "@/components/atoms";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  /** `false` drops the border and padding of a standalone card, for use inside an existing card. */
  bordered?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  bordered = true,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 px-6 text-center ${
        bordered
          ? "border-border-light bg-surface-light rounded-md border py-12"
          : "py-14"
      }`}
    >
      {icon && (
        <div className="bg-bg-light text-text-secondary flex size-12 items-center justify-center rounded-full">
          <Icon icon={icon} size="lg" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-large text-text-primary font-semibold">{title}</h3>
        {description && (
          <p className="text-body text-text-secondary mx-auto max-w-md">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
