"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, ChevronDown, LayoutDashboard, LucideIcon } from "lucide-react";
import { Icon, Progress } from "@/components/atoms";
import { ProgressRing } from "@/components/molecules/progress-ring";
import { focusRing } from "@/lib/ui";

export interface SidebarLink {
  label: string;
  href?: string;
  icon?: LucideIcon;
  badge?: string;
  children?: { label: string; href: string }[];
  /** Renders a small uppercase section heading above this link, starting a new group. */
  groupLabel?: string;
}

export interface SidebarProps {
  links?: SidebarLink[];
  /** Profile completion %. The completion card only shows while below 100. */
  profileCompletion?: number;
  /** "panel" renders the persistent desktop aside (hidden below lg). "bare" renders just the content, for the navbar's mobile panel or an AppShell `sidebar` slot. */
  variant?: "panel" | "bare";
  onNavigate?: () => void;
  /** Icon-only rail: labels fade out, icons stay where they are, titles show on hover. */
  compact?: boolean;
  /** Overrides the pathname used to mark the active link (defaults to `usePathname()`). */
  activeHref?: string;
}

const defaultLinks: SidebarLink[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
];

function SidebarGroup({
  link,
  pathname,
  onNavigate,
  compact,
}: {
  link: SidebarLink;
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const children = link.children ?? [];
  const hasActiveChild = children.some((child) => child.href === pathname);
  const [open, setOpen] = useState(hasActiveChild);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        title={compact ? link.label : undefined}
        className={`text-large ${focusRing} flex w-full items-center gap-3.5 overflow-hidden rounded-md px-4 py-3 text-left font-medium whitespace-nowrap transition-colors hover:cursor-pointer ${
          hasActiveChild
            ? "bg-primary-light text-primary font-semibold"
            : "text-text-secondary hover:bg-bg-light hover:text-text-primary"
        }`}
      >
        {link.icon && <Icon icon={link.icon} size="md" />}
        <span className={`flex-1 transition-opacity duration-200 ${compact ? "opacity-0" : ""}`}>{link.label}</span>
        <Icon icon={ChevronDown} size="sm" className={`transition-transform ${open ? "rotate-180" : ""} ${compact ? "opacity-0" : ""}`} />
      </button>
      {open && !compact && (
        <div className="border-border-light mt-1 ml-6 flex flex-col gap-1 border-l pl-4">
          {children.map((child) => {
            const isActive = child.href === pathname;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`text-body ${focusRing} rounded-sm px-3 py-1.5 font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:bg-bg-light hover:text-text-primary"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  links = defaultLinks,
  profileCompletion,
  variant = "panel",
  onNavigate,
  compact = false,
  activeHref,
}: SidebarProps) {
  const currentPath = usePathname();
  const pathname = activeHref ?? currentPath;

  const body = (
    <div className="flex h-full min-h-0 flex-col">
      <nav aria-label="Sidebar" className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-4 pt-5 pb-3">
        {links.map((link, index) => {
          const active = pathname === link.href;
          return (
            <div key={link.label} className="space-y-1">
              {link.groupLabel && (
                <p
                  aria-hidden={compact || undefined}
                  className={`text-small text-text-secondary px-4 ${index === 0 ? "pt-1" : "pt-6"} pb-2 font-bold tracking-widest whitespace-nowrap uppercase transition-opacity duration-200 ${compact ? "opacity-0" : ""}`}
                >
                  {link.groupLabel}
                </p>
              )}
              {link.children ? (
                <SidebarGroup link={link} pathname={pathname} onNavigate={onNavigate} compact={compact} />
              ) : (
                <Link
                  href={link.href ?? "#"}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  aria-label={compact ? link.label : undefined}
                  title={compact ? link.label : undefined}
                  className={`text-large ${focusRing} group relative flex items-center gap-3.5 overflow-hidden rounded-md px-4 py-3 font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-primary-light text-primary font-semibold"
                      : "text-text-secondary hover:bg-bg-light hover:text-text-primary"
                  }`}
                >
                  {active && (
                    <span className="bg-secondary absolute inset-y-2 left-0 w-1 rounded-full" aria-hidden="true" />
                  )}
                  {link.icon && <Icon icon={link.icon} size="md" />}
                  <span className={`flex-1 transition-opacity duration-200 ${compact ? "opacity-0" : ""}`}>{link.label}</span>
                  {link.badge && (
                    <span className="bg-primary-light text-small text-primary rounded-full px-1.5 py-0.5 font-semibold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {profileCompletion !== undefined && profileCompletion < 100 && compact && (
        <div className="mx-auto mb-4" title={`Profile ${profileCompletion}% complete`}>
          <ProgressRing value={profileCompletion} sizeClassName="size-11" />
        </div>
      )}
      {profileCompletion !== undefined && profileCompletion < 100 && !compact && (
        <div className="border-border-light bg-bg-subtle mx-4 mb-4 space-y-2 rounded-md border p-4">
          <p className="text-small text-text-secondary">
            Profile <span className="text-text-primary font-semibold">{profileCompletion}</span>% complete
          </p>
          <Progress value={profileCompletion} label="Profile completion" tone="secondary" />
        </div>
      )}
    </div>
  );

  if (variant === "bare") return body;

  return (
    <aside className="border-border-light bg-surface-light hidden w-72 shrink-0 flex-col border-r shadow-sm lg:flex">
      {body}
    </aside>
  );
}
