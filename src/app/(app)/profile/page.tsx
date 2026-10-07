import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/server/session";
import { loadProfile } from "@/lib/server/profile";
import { sectionsFor } from "@/lib/profile/config";
import { ROLE_BY_NAME, type SectionId } from "@/lib/profile/types";
import { EmptyState } from "@/components/molecules";
import { ProfileEditor } from "./_components/profile-editor";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getSession();
  const role = session && ROLE_BY_NAME[session.roleName];
  if (!session || !role) redirect("/sign-in");

  const loaded = await loadProfile({ session, role });
  if (!loaded) return <EmptyState title="We couldn’t load your profile" description="Please refresh the page in a moment." />;

  const { tab } = await searchParams;
  const initialTab = sectionsFor(role).find((id) => id === tab) as SectionId | undefined;

  return <ProfileEditor initial={loaded.profile} initialTab={initialTab ?? null} displayName={session.fullName} accountEmail={session.email} />;
}
