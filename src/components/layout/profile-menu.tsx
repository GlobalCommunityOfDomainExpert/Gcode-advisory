"use client";

import { useRef, useState } from "react";
import { ChevronDown, Gift, LogOut, Settings, User } from "lucide-react";
import { Avatar, Icon } from "@/components/atoms";
import { useDismiss } from "@/hooks/use-dismiss";
import { cn } from "@/lib/cn";
import { focusRingOnNavy } from "@/lib/ui";

export interface ProfileMenuUser {
  name: string;
  role: string;
  avatarSrc?: string;
  /** Defaults to the first letters of `name`. */
  avatarInitials?: string;
}

export interface ProfileMenuProps {
  user: ProfileMenuUser;
  /** Shown under the name in the menu header. */
  email?: string;
  onViewProfile?: () => void;
  onSettings?: () => void;
  onRefer?: () => void;
  onLogout?: () => void;
  /** Render the menu open on first paint. */
  defaultOpen?: boolean;
}

const itemClass = "text-body flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors";

/**
 * The account menu in the navbar: avatar + name + role, opening a dropdown with the identity header, account links and
 * Logout. The name and chevron collapse to just the avatar below `md`.
 */
export function ProfileMenu({
  user,
  email,
  onViewProfile,
  onSettings,
  onRefer,
  onLogout,
  defaultOpen = false,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useDismiss(rootRef, open, close);

  const item = (icon: typeof User, label: string, onSelect?: () => void) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        onSelect?.();
        close();
      }}
      className={cn(itemClass, "text-text-primary hover:bg-bg-light")}
    >
      <Icon icon={icon} size="sm" className="text-text-secondary" />
      {label}
    </button>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn("flex items-center gap-2 rounded-md p-1.5 text-left text-white transition-colors hover:bg-white/10", focusRingOnNavy)}
      >
        <Avatar alt={user.name} src={user.avatarSrc} initials={user.avatarInitials} size="sm" />
        <span className="hidden min-w-0 text-left md:inline">
          <span className="text-small block truncate font-semibold text-white">{user.name}</span>
          <span className="text-small block truncate text-white/70">{user.role}</span>
        </span>
        <Icon
          icon={ChevronDown}
          size="sm"
          className={cn("hidden shrink-0 text-white/70 transition-transform md:block", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-menu-in border-border-light bg-surface-light absolute top-full right-0 z-50 mt-2 w-64 overflow-hidden rounded-md border shadow-lg"
        >
          <div className="border-border-light border-b px-4 py-3">
            <p className="text-body text-text-primary truncate font-semibold">{user.name}</p>
            {email && <p className="text-small text-text-secondary truncate">{email}</p>}
          </div>
          <div className="py-1">
            {item(User, "View profile", onViewProfile)}
            {item(Settings, "Account settings", onSettings)}
            {item(Gift, "Refer a friend", onRefer)}
          </div>
          <div className="border-border-light border-t py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onLogout?.();
                close();
              }}
              className={cn(itemClass, "text-danger hover:bg-danger-light")}
            >
              <Icon icon={LogOut} size="sm" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
