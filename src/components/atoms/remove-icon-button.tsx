import { X } from "lucide-react";
import { Icon } from "@/components/atoms";

export interface RemoveIconButtonProps {
  onClick: () => void;
  ariaLabel: string;
  size?: "sm" | "md";
}

export function RemoveIconButton({
  onClick,
  ariaLabel,
  size = "sm",
}: RemoveIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`text-text-secondary hover:text-danger focus-visible:ring-primary rounded-full ${
        size === "sm" ? "p-1" : "p-2"
      } focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none`}
    >
      <Icon icon={X} size="sm" />
    </button>
  );
}
