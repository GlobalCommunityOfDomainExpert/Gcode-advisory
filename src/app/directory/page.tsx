import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/session";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Directory" };

/** Landing page after onboarding (Sprint 1 placeholder: the directory itself is built in Sprint 3). Signed-in only. */
export default async function DirectoryPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?redirect=/directory");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-start justify-center gap-4 px-4 sm:px-6 lg:px-8">
      <p className="text-small font-bold tracking-widest text-text-secondary uppercase">Directory</p>
      <h1 className="text-display font-extrabold text-primary">Welcome{session.fullName ? `, ${session.fullName.split(" ")[0]}` : ""}</h1>
      <p className="text-body text-text-secondary">You’re signed in as {session.roleName === "NONE" ? "a new member" : session.roleName.toLowerCase()}. The directory opens in Sprint 3.</p>
      <SignOutButton />
    </main>
  );
}
