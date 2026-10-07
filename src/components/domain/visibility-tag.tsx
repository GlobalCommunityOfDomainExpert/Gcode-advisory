import { Globe, Lock, LockKeyholeOpen } from "lucide-react";
import { Icon } from "@/components/atoms";

/** public: everyone · contact: visitors, only after they get in touch · private: only you. */
export type Visibility = "public" | "contact" | "private";

const VIS = {
  public: { icon: Globe, label: "Public", cls: "bg-success-light text-success" },
  contact: { icon: LockKeyholeOpen, label: "After contact", cls: "bg-warning-light text-warning" },
  private: { icon: Lock, label: "Only you", cls: "bg-bg-light text-text-secondary" },
};

/** Who can see this? Makes the Profile / Account-settings split obvious everywhere. */
export function VisibilityTag({ type }: { type: Visibility }) {
  const { icon, label, cls } = VIS[type];
  return (
    <span className={`${cls} text-small inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium`}>
      <Icon icon={icon} size="sm" className="size-3.5!" />
      {label}
    </span>
  );
}
