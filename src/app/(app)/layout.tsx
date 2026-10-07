import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/session";
import { loadProfile } from "@/lib/server/profile";
import { ROLE_BY_NAME, ROLE_LABEL } from "@/lib/profile/types";
import { AppFrame } from "./_components/app-frame";

/** Every signed-in page: the authed shell plus the non-blocking "finish your profile" nudge. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const role = ROLE_BY_NAME[session.roleName];
  // Signed in but never chose who they are: finish that first.
  if (!role) redirect("/sign-up");

  const loaded = await loadProfile({ session, role });
  const photo = loaded?.profile.files.photo?.url;

  return (
    <AppFrame
      user={{ name: session.fullName || "Account", role: ROLE_LABEL[role], avatarSrc: photo }}
      email={session.email}
      completion={loaded?.completion.pct}
    >
      {children}
    </AppFrame>
  );
}
