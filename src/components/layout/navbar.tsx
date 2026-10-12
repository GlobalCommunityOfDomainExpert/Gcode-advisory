"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { Button, Icon } from "@/components/atoms";
import { focusRingOnNavy } from "@/lib/ui";
import { Wordmark } from "./wordmark";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavbarProps {
  /** Defaults to the wordmark. */
  logo?: ReactNode;
  /** Right-aligned links shown from `md` up (e.g. "Find an expert"). */
  links?: NavLink[];
  /** Notification bell (see `NotifMenu`). */
  notifications?: ReactNode;
  /** Account dropdown (see `ProfileMenu variant="navbar"`). Replaces the CTA buttons when provided. */
  accountMenu?: ReactNode;
  /** Logo only — for signed-out pages that sit behind a modal. */
  guest?: boolean;
  /**
   * Signed-out actions, shown whenever there is no `accountMenu` (and not `guest`).
   * Defaults: "Sign in" (ghost) and "Register" (red). Signed-in users get the account menu instead.
   */
  ctaLabel?: string;
  onCtaClick?: () => void;
  secondaryCtaLabel?: string;
  onSecondaryCtaClick?: () => void;
  /**
   * Floats over the page (e.g. a hero) and turns solid navy once the scroll container scrolls past 8px.
   * Off by default: the navbar is solid navy and sits in the flow.
   */
  transparent?: boolean;
  /** Scroll container watched in `transparent` mode. Defaults to the AppShell's `app-scroll-region`, then the window. */
  scrollContainerId?: string;
  /** Desktop (lg+) button that shrinks the sidebar to a rail / expands it. `open` = full width. Omit when there is no sidebar. */
  sidebarToggle?: { open: boolean; onToggle: () => void };
  /** Content of the mobile panel (usually a "bare" Sidebar). The hamburger shows below `lg`. */
  mobileFooter?: ReactNode;
}

/** Header height, in one place — the mobile backdrop offset and panel max-height are derived from it. */
const HEADER_HEIGHT_REM = 5; // h-20

/** True once the scroll container (or window) has scrolled past `threshold`. Only listens when `enabled`. */
function useScrolledPast(containerId: string, threshold: number, enabled: boolean) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const el = document.getElementById(containerId);
    const target: HTMLElement | Window = el ?? window;
    const read = () => (el ? el.scrollTop : window.scrollY);
    const onScroll = () => setScrolled(read() > threshold);
    onScroll();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [containerId, threshold, enabled]);

  return scrolled;
}

export function Navbar({
  logo = <Wordmark />,
  links = [],
  notifications,
  accountMenu,
  guest = false,
  ctaLabel = "Register",
  onCtaClick,
  secondaryCtaLabel = "Sign in",
  onSecondaryCtaClick,
  mobileFooter,
  sidebarToggle,
  transparent = false,
  scrollContainerId = "app-scroll-region",
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolled = useScrolledPast(scrollContainerId, 8, transparent);
  const solid = !transparent || scrolled || mobileOpen;

  return (
    <header
      className={`z-30 transition-colors duration-300 ${
        transparent ? "fixed inset-x-0 top-0" : "relative"
      } ${solid ? "bg-primary shadow-sm" : "bg-transparent shadow-none"}`}
    >
      <div className="mx-4 flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          {sidebarToggle && !guest && (
            <button
              type="button"
              onClick={sidebarToggle.onToggle}
              aria-label={sidebarToggle.open ? "Collapse sidebar" : "Expand sidebar"}
              aria-expanded={sidebarToggle.open}
              className={`${focusRingOnNavy} -mr-4 hidden rounded-sm p-2 text-white/80 transition-colors hover:text-white lg:block`}
            >
              <Icon icon={sidebarToggle.open ? PanelLeftClose : PanelLeftOpen} size="md" />
            </button>
          )}
          {logo}
        </div>

        {!guest && (
          <div className="flex items-center gap-1 sm:gap-3">
            {links.map((link) => {
              const active = pathname === link.href || (pathname ?? "").startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`${focusRingOnNavy} text-body hidden rounded-sm px-2 py-1 font-medium transition-colors md:inline-block ${
                    active ? "text-white" : "text-white/70 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {notifications}
            {accountMenu ?? (
              <>
                {secondaryCtaLabel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10"
                    onClick={onSecondaryCtaClick}
                  >
                    {secondaryCtaLabel}
                  </Button>
                )}
                {ctaLabel && (
                  <Button variant="accent" size="sm" onClick={onCtaClick}>
                    {ctaLabel}
                  </Button>
                )}
              </>
            )}
            {mobileFooter && (
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className={`${focusRingOnNavy} rounded-sm p-2 text-white lg:hidden`}
              >
                <Icon icon={mobileOpen ? X : Menu} size="md" />
              </button>
            )}
          </div>
        )}
      </div>

      {!guest && mobileFooter && mobileOpen && (
        <div className="lg:hidden">
          <div
            className="bg-primary/40 fixed inset-x-0 bottom-0 z-30"
            style={{ top: `${HEADER_HEIGHT_REM}rem` }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            className="bg-primary absolute inset-x-0 top-full z-40 overflow-y-auto border-t border-white/10 shadow-lg"
            style={{ maxHeight: `calc(100vh - ${HEADER_HEIGHT_REM}rem)` }}
          >
            <div className="bg-bg-light">{mobileFooter}</div>
          </div>
        </div>
      )}
    </header>
  );
}
