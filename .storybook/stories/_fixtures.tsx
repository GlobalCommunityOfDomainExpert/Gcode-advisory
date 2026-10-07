import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  LayoutDashboard,
  Settings,
  UserRound,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { NotifItem } from "@/components/layout/notif-menu";
import type { SidebarLink } from "@/components/layout/sidebar";

/** Sample data mirroring the wireframe (expert perspective), shared by layout stories. */

export const EXPERT_NOTIFICATIONS: NotifItem[] = [
  { icon: CalendarPlus, tone: "warning", title: "New booking request", text: "Riya Kapoor requested a career-roadmap session.", time: "5 min ago", unread: true },
  { icon: Wallet, tone: "success", title: "Payout sent", text: "₹3,400 is on its way to your HDFC account.", time: "2 h ago", unread: true },
  { icon: CalendarClock, tone: "warning", title: "Reschedule requested", text: "Neha Joshi proposed Fri, 9 Oct · 12:00 PM. Accept or decline.", time: "Yesterday" },
];

export const EXPERT_SIDEBAR_LINKS: SidebarLink[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, groupLabel: "Workspace" },
  { label: "Directory", href: "/directory", icon: UsersRound },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck },
  { label: "Payouts", href: "/payouts", icon: Wallet },
  { label: "Profile", href: "/profile", icon: UserRound, groupLabel: "Account" },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const AARAV = {
  name: "Aarav Sharma",
  role: "Domain Expert",
  avatarInitials: "AS",
  avatarSrc: "https://randomuser.me/api/portraits/men/75.jpg",
};
export const AARAV_EMAIL = "aarav@example.com";
