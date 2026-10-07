"use client";

import { ReactNode, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ProfileMenu, ProfileMenuUser } from "./profile-menu";
import { AppShell } from "./app-shell";
import { Navbar, NavLink } from "./navbar";
import { NotifItem, NotifMenu } from "./notif-menu";
import { Sidebar, SidebarLink } from "./sidebar";

export interface AuthedShellProps {
  user: ProfileMenuUser;
  email?: string;
  /** Right-aligned navbar links (e.g. "Find an expert"). */
  links?: NavLink[];
  sidebarLinks: SidebarLink[];
  /** Shows the completion card in the sidebar while below 100. */
  profileCompletion?: number;
  notifications?: NotifItem[];
  onViewProfile?: () => void;
  onSettings?: () => void;
  onRefer?: () => void;
  onLogout?: () => void;
  onNotificationSettings?: () => void;
  /** Force the sidebar off (or on) regardless of the route. Default: decided by `hideSidebarOn`. */
  hideSidebar?: boolean;
  /** Route prefixes that render without a sidebar: focused flows. Default: the call room and checkout. */
  hideSidebarOn?: string[];
  /** Let users shrink the sidebar to an icon rail on desktop (button in the navbar). Remembered in localStorage. Default: true. */
  collapsible?: boolean;
  children: ReactNode;
}

/** Focused flows where navigation would only distract. */
export const FOCUSED_ROUTES = ["/call", "/checkout"];

const STORAGE_KEY = "gcode.sidebar";
const CHANGE_EVENT = "gcode:sidebar";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const readOpen = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "compact";
  } catch {
    return true;
  }
};

/** Sidebar full (true) or compact rail (false), remembered in localStorage. Server render and first paint are always full. */
function useSidebarOpen(): [boolean, () => void] {
  const open = useSyncExternalStore(subscribe, readOpen, () => true);
  const toggle = () => {
    try {
      localStorage.setItem(STORAGE_KEY, open ? "compact" : "full");
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };
  return [open, toggle];
}

const matchesRoute = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * The default frame for every signed-in advisory page: navbar (bell + account menu with Logout) over a sidebar and
 * the page. Below `lg` the sidebar moves into the navbar's hamburger panel.
 */
export function AuthedShell({
  user,
  email,
  links = [],
  sidebarLinks,
  profileCompletion,
  notifications = [],
  onViewProfile,
  onSettings,
  onRefer,
  onLogout,
  onNotificationSettings,
  hideSidebar,
  hideSidebarOn = FOCUSED_ROUTES,
  collapsible = true,
  children,
}: AuthedShellProps) {
  const pathname = usePathname() ?? "";
  const showSidebar = !(hideSidebar ?? hideSidebarOn.some((r) => matchesRoute(pathname, r)));
  const [open, toggle] = useSidebarOpen();
  const sidebar = <Sidebar variant="bare" links={sidebarLinks} profileCompletion={profileCompletion} />;
  const desktopSidebar = (
    <Sidebar variant="bare" links={sidebarLinks} profileCompletion={profileCompletion} compact={!open} />
  );
  return (
    <AppShell
      navbar={
        <Navbar
          links={links}
          notifications={<NotifMenu items={notifications} onSettingsClick={onNotificationSettings} />}
          accountMenu={
            <ProfileMenu
              user={user}
              email={email}
              onViewProfile={onViewProfile}
              onSettings={onSettings}
              onRefer={onRefer}
              onLogout={onLogout}
            />
          }
          mobileFooter={showSidebar ? sidebar : undefined}
          sidebarToggle={showSidebar && collapsible ? { open, onToggle: toggle } : undefined}
        />
      }
      sidebar={showSidebar ? desktopSidebar : undefined}
      sidebarCompact={!open}
    >
      {children}
    </AppShell>
  );
}
