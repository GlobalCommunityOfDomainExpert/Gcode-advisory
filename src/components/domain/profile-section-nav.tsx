import { Check, LucideIcon } from "lucide-react";
import { IconTile } from "@/components/molecules/icon-tile";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/ui";

export interface ProfileSectionNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  filled: number;
  total: number;
}

export interface ProfileSectionNavProps {
  items: ProfileSectionNavItem[];
  /** Index of the section being edited. */
  active: number;
  onSelect?: (index: number) => void;
}

/** The profile editor's section list: icon tile, label, `filled/total`, and a thin progress bar per section. */
export function ProfileSectionNav({ items, active, onSelect }: ProfileSectionNavProps) {
  return (
    <>
      {items.map((item, i) => {
        const done = item.filled === item.total;
        const current = i === active;
        const pct = Math.round((item.filled / item.total) * 100);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(i)}
            aria-current={current ? "step" : undefined}
            className={cn(
              "text-body group flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors",
              focusRing,
              current ? "bg-primary-light" : "hover:bg-bg-subtle",
            )}
          >
            <IconTile icon={done ? Check : item.icon} tone={done ? "success" : current ? "solid" : "neutral"} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className={cn("truncate font-medium", current ? "text-primary" : "text-text-primary")}>{item.label}</span>
                <span className={cn("text-small tabular-nums", done ? "text-success" : "text-text-secondary")}>
                  {item.filled}/{item.total}
                </span>
              </span>
              <span className="bg-bg-light mt-1.5 block h-1 overflow-hidden rounded-full">
                <span className={cn("block h-full rounded-full transition-[width]", done ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
              </span>
            </span>
          </button>
        );
      })}
    </>
  );
}
