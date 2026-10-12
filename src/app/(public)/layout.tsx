import { ReactNode } from "react";
import { getSession } from "@/lib/server/session";
import AppLayout from "../(app)/layout";
import { PublicFrame } from "./_components/public-frame";

/**
 * Pages anyone can open. Signed in: the normal app frame (sidebar, bell). Signed out: the guest navbar with Sign in and
 * Register. Either way the page itself is the same, so a shared link looks right to both.
 */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session) return <AppLayout>{children}</AppLayout>;
  return <PublicFrame>{children}</PublicFrame>;
}
