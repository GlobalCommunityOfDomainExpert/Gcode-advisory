"use client";

import { useRef, useState } from "react";
import { Bell, Settings, type LucideIcon } from "lucide-react";
import { Icon } from "@/components/atoms";
import { useDismiss } from "@/hooks/use-dismiss";

export interface NotifItem {
  /** Stable key. Falls back to the title. */
  id?: string | number;
  icon: LucideIcon;
  tone: "primary" | "success" | "warning";
  title: string;
  text: string;
  time: string;
  unread?: boolean;
  onClick?: () => void;
}

export interface NotifMenuProps {
  items: NotifItem[];
  /** Start with everything marked as read (no badge). */
  allRead?: boolean;
  /** Render the dropdown open on first paint. */
  defaultOpen?: boolean;
  onSettingsClick?: () => void;
  /** When given, the parent owns "read": the badge counts items still marked unread and this is called by Mark all as read. */
  onMarkAllRead?: () => void;
}

const toneClasses: Record<NotifItem["tone"], string> = {
  primary: "bg-primary-light text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
};

/** The bell in the top nav: unread count badge + dropdown. Closes on outside click and Escape. */
export function NotifMenu({ items, allRead = false, defaultOpen = false, onSettingsClick, onMarkAllRead }: NotifMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [read, setRead] = useState(allRead);
  const rootRef = useRef<HTMLDivElement>(null);
  const localRead = onMarkAllRead ? false : read;
  const count = localRead ? 0 : items.filter((n) => n.unread).length;

  useDismiss(rootRef, open, () => setOpen(false));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Notifications${count ? `, ${count} unread` : ""}`}
        className="focus-visible:ring-offset-primary relative grid size-10 place-items-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <Icon icon={Bell} size="md" />
        <span
          className={`bg-secondary ring-primary absolute top-1 right-1 min-w-4 place-items-center rounded-full px-1 text-[0.65rem] leading-4 font-bold text-white ring-2 ${
            count ? "grid" : "hidden"
          }`}
        >
          {count}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="animate-menu-in border-border-light bg-surface-light fixed inset-x-3 top-[4.5rem] z-50 overflow-hidden rounded-md border shadow-lg sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96"
        >
          <div className="border-border-light flex items-center justify-between border-b px-4 py-3">
            <p className="text-body text-text-primary font-semibold">Notifications</p>
            <button
              type="button"
              onClick={() => (onMarkAllRead ? onMarkAllRead() : setRead(true))}
              className="text-small text-primary hover:text-primary-hover rounded-sm font-medium hover:underline"
            >
              Mark all as read
            </button>
          </div>
          <div className="divide-border-light max-h-96 divide-y overflow-y-auto">
            {items.length ? (
              items.map((n) => (
                <button
                  key={n.id ?? n.title}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    n.onClick?.();
                    setOpen(false);
                  }}
                  className="hover:bg-bg-light flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
                >
                  <span className={`${toneClasses[n.tone]} mt-0.5 grid size-9 shrink-0 place-items-center rounded-md`}>
                    <Icon icon={n.icon} size="sm" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-body text-text-primary block leading-snug font-semibold">{n.title}</span>
                    <span className="text-small text-text-secondary block">{n.text}</span>
                    <span className="text-small text-text-secondary/70 mt-0.5 block">{n.time}</span>
                  </span>
                  {n.unread && !localRead && (
                    <span className="bg-secondary mt-2 size-2 shrink-0 rounded-full" aria-label="Unread" />
                  )}
                </button>
              ))
            ) : (
              <p className="text-small text-text-secondary px-4 py-10 text-center">You’re all caught up.</p>
            )}
          </div>
          {onSettingsClick && (
            <div className="border-border-light border-t py-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onSettingsClick?.();
                  setOpen(false);
                }}
                className="text-small text-text-secondary hover:text-text-primary hover:bg-bg-light flex w-full items-center justify-center gap-2 px-4 py-2.5 font-medium transition-colors"
              >
                <Icon icon={Settings} size="sm" />
                Notification settings
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
