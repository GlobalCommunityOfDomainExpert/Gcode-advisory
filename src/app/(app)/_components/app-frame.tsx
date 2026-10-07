"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserRound, Users } from "lucide-react";
import { AuthedShell } from "@/components/layout";
import type { ProfileMenuUser } from "@/components/layout";
import type { SidebarLink } from "@/components/layout";
import { Banner } from "@/components/molecules";
import { postAuth } from "@/lib/auth/client";

const SIDEBAR: SidebarLink[] = [
  { label: "Directory", href: "/directory", icon: Users, groupLabel: "Workspace" },
  { label: "Profile", href: "/profile", icon: UserRound, groupLabel: "Account" },
];

export interface AppFrameProps {
  user: ProfileMenuUser;
  email?: string;
  /** Profile completion, 0 to 100. Undefined when it couldn't be loaded. */
  completion?: number;
  children: ReactNode;
}

export function AppFrame({ user, email, completion, children }: AppFrameProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [leaving, setLeaving] = useState(false);

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
      sidebarLinks={SIDEBAR}
      profileCompletion={completion}
      onViewProfile={() => router.push("/profile")}
      onLogout={logout}
    >
      {nudge}
      {children}
    </AuthedShell>
  );
}
