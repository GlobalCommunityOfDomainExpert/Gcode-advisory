import { LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/atoms";
import { EmptyState } from "./empty-state";

export interface NotFoundStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}

export function NotFoundState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
}: NotFoundStateProps) {
  return (
    <div className="mx-auto max-w-md">
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        action={
          <ButtonLink href={actionHref} variant="primary">
            {actionLabel}
          </ButtonLink>
        }
      />
    </div>
  );
}
