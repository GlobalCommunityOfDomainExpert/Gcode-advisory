import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/session";

/** Call rooms: signed-in only, and no app chrome (no navbar, sidebar or footer). Each page draws its own full-screen room. */
export default async function RoomLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return <>{children}</>;
}
