"use client";

import { useState, type FocusEvent, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, ChevronDown, LayoutDashboard, LucideIcon } from "lucide-react";
import { Icon, Progress } from "@/components/atoms";
import { ProgressRing } from "@/components/molecules/progress-ring";
import { focusRing } from "@/lib/ui";

/** Where the rail's label tooltip goes: to the right of the hovered or focused row. */
interface RailTip {
  label: string;
  x: number;
  y: number;
}
type TipHandlers = (label: string) => {
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: () => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: () => void;
};

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

/** Height and fade in one move: 1fr <-> 0fr rows animate to the content's real height, which max-height cannot do. */
function Fold({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

function SidebarGroup({
  link,
  pathname,
  onNavigate,
  compact,
  tip,
}: {
  link: SidebarLink;
  pathname: string;
  onNavigate?: () => void;
  compact?: boolean;
  tip: TipHandlers;
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
        aria-label={compact ? link.label : undefined}
        {...tip(link.label)}
        className={`text-body ${focusRing} flex w-full items-center gap-3 overflow-hidden rounded-md px-[calc(1.125rem-0.5px)] py-2.5 text-left font-medium whitespace-nowrap transition-colors hover:cursor-pointer ${
          hasActiveChild
            ? "bg-primary-light text-primary font-semibold"
            : "text-text-secondary hover:bg-bg-light hover:text-text-primary"
        }`}
      >
        {link.icon && <Icon icon={link.icon} size="sm" className={`shrink-0 transition-transform duration-300 ${compact ? "scale-125" : ""}`} />}
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
                className={`text-small ${focusRing} rounded-sm px-3 py-1.5 font-medium transition-colors ${
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
  const [railTip, setRailTip] = useState<RailTip | null>(null);

  // Native title tooltips are slow and unstyled. In the rail the label shows at once, to the right of the icon. It is
  // position: fixed because the rail clips its own overflow.
  const show = (label: string) => (e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setRailTip({ label, x: r.right + 10, y: r.top + r.height / 2 });
  };
  const tip: TipHandlers = (label) => (compact ? { onMouseEnter: show(label), onMouseLeave: () => setRailTip(null), onFocus: show(label), onBlur: () => setRailTip(null) } : {});

  const body = (
    <div className="flex h-full min-h-0 flex-col">
      <nav aria-label="Sidebar" className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-4 pt-5 pb-3">
        {links.map((link, index) => {
          const active = pathname === link.href;
          return (
            <div key={link.label} className="space-y-1">
              {link.groupLabel && (
                // Expanded: the heading. Collapsed: the heading folds away and a short row of dots opens in its place (none above the first
                // group). Both animate their height, so the rows below glide into place instead of leaving a gap or jumping.
                <div aria-hidden={compact || undefined}>
                  <Fold open={!compact}>
                    <p className={`text-small text-text-secondary px-4 ${index === 0 ? "pt-0.5" : "pt-4"} pb-1.5 font-semibold tracking-wider whitespace-nowrap uppercase`}>
                      {link.groupLabel}
                    </p>
                  </Fold>
                  {index > 0 && (
                    <Fold open={compact}>
                      <span role="separator" className="flex justify-center gap-1 py-3">
                        <span className="bg-primary/30 size-1 rounded-full" />
                        <span className="bg-primary/30 size-1 rounded-full" />
                        <span className="bg-primary/30 size-1 rounded-full" />
                      </span>
                    </Fold>
                  )}
                </div>
              )}
              {link.children ? (
                <SidebarGroup link={link} pathname={pathname} onNavigate={onNavigate} compact={compact} tip={tip} />
              ) : (
                <Link
                  href={link.href ?? "#"}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  aria-label={compact ? link.label : undefined}
                  {...tip(link.label)}
                  className={`text-body ${focusRing} group relative flex items-center gap-3 overflow-hidden rounded-md px-[calc(1.125rem-0.5px)] py-2.5 font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-primary-light text-primary font-semibold"
                      : "text-text-secondary hover:bg-bg-light hover:text-text-primary"
                  }`}
                >
                  {active && (
                    <span className="bg-secondary absolute inset-y-2 left-0 w-1 rounded-full" aria-hidden="true" />
                  )}
                  {link.icon && <Icon icon={link.icon} size="sm" className={`shrink-0 transition-transform duration-300 ${compact ? "scale-125" : ""}`} />}
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

      {compact && railTip && (
        <div
          role="tooltip"
          style={{ top: railTip.y, left: railTip.x }}
          className="bg-primary text-small pointer-events-none fixed z-50 -translate-y-1/2 rounded-sm px-2.5 py-1.5 font-medium whitespace-nowrap text-white shadow-lg before:absolute before:top-1/2 before:-left-1 before:size-2 before:-translate-y-1/2 before:rotate-45 before:bg-primary"
        >
          {railTip.label}
        </div>
      )}
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
