"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarCheck, CalendarClock, CalendarX, Clock, Inbox, Send, Settings, UserRound, Users, Video, Wallet, type LucideIcon } from "lucide-react";
import { AuthedShell } from "@/components/layout";
import type { ProfileMenuUser } from "@/components/layout";
import type { SidebarLink } from "@/components/layout";
import { Banner } from "@/components/molecules";
import { postAuth } from "@/lib/auth/client";
import { timeAgo } from "@/lib/booking/time";
import { useNotifications } from "@/lib/notifications/use-notifications";
import type { NotifItem } from "@/components/layout";

/** Experts also get Payouts (their earnings), as in the wireframe. */
const sidebarFor = (isExpert: boolean): SidebarLink[] => [
  { label: "Directory", href: "/directory", icon: Users, groupLabel: "Workspace" },
  { label: "My bookings", href: "/bookings", icon: CalendarClock },
  ...(isExpert ? [{ label: "Payouts", href: "/payouts", icon: Wallet }] : []),
  { label: "Profile", href: "/profile/view", icon: UserRound, groupLabel: "Account" },
  { label: "Account settings", href: "/settings", icon: Settings },
];

/** Top-bar shortcut, as in the wireframe. */
const NAV_LINKS = [{ label: "Find an expert", href: "/directory" }];

/** What each kind of notification looks like in the bell. */
function look(type: string): { icon: LucideIcon; tone: NotifItem["tone"] } {
  if (type.startsWith("REMINDER_10M")) return { icon: Video, tone: "warning" };
  if (type.startsWith("REMINDER")) return { icon: Clock, tone: "warning" };
  if (type === "NEW_REQUEST") return { icon: Inbox, tone: "warning" };
  if (type === "REQUEST_SENT") return { icon: Send, tone: "primary" };
  if (type.startsWith("ACCEPTED")) return { icon: CalendarCheck, tone: "success" };
  return { icon: CalendarX, tone: "warning" };
}

export interface AppFrameProps {
  user: ProfileMenuUser;
  email?: string;
  /** Profile completion, 0 to 100. Undefined when it couldn't be loaded. */
  completion?: number;
  isExpert?: boolean;
  children: ReactNode;
}

export function AppFrame({ user, email, completion, isExpert = false, children }: AppFrameProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [leaving, setLeaving] = useState(false);
  const { items, markRead, markAllRead } = useNotifications();
  const notifications: NotifItem[] = items.map((n) => ({
    id: n.id,
    ...look(n.type),
    title: n.title,
    text: n.text,
    time: timeAgo(n.createdAt),
    unread: n.unread,
    onClick: () => {
      markRead(n.id);
      if (n.link.startsWith("/")) router.push(n.link);
    },
  }));

  async function logout() {
    if (leaving) return;
    setLeaving(true);
    await postAuth("sign-out", {});
    router.replace("/sign-in");
    router.refresh();
  }

  // Never a redirect, never a gate: a banner on every app screen except the profile editor itself.
  const nudge =
    completion !== undefined && completion < 100 && !pathname.startsWith("/profile") ? (
      <div className="pt-6">
        <Banner tone="warning">
          <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span>
              Your profile is <b>{completion}% complete</b>. Others can’t find you until it’s finished and published.
            </span>
            <Link href="/profile" className="text-primary font-bold underline underline-offset-2">
              Finish profile
            </Link>
          </span>
        </Banner>
      </div>
    ) : null;

  return (
    <AuthedShell
      user={user}
      email={email}
      links={NAV_LINKS}
      sidebarLinks={sidebarFor(isExpert)}
      profileCompletion={completion}
      notifications={notifications}
      onMarkAllNotificationsRead={markAllRead}
      onViewProfile={() => router.push("/profile/view")}
      onSettings={() => router.push("/settings")}
      onLogout={logout}
    >
      {nudge}
      {children}
    </AuthedShell>
  );
}
