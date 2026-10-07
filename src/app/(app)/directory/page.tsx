import type { Metadata } from "next";
import { PageHeader } from "@/components/layout";
import { EmptyState } from "@/components/molecules";
import { Users } from "lucide-react";

export const metadata: Metadata = { title: "Directory" };

/** Sprint 1 landing placeholder; the directory itself is built in Sprint 3. The (app) layout guarantees a signed-in user. */
export default function DirectoryPage() {
  return (
    <>
      <PageHeader eyebrow="Directory" title="Find your people" subtitle="Every new account lands here, whether or not the profile is finished." />
      <EmptyState icon={Users} title="The directory opens in Sprint 3" description="Sign-up, email verification and role choice are done. Finish your profile in the meantime so people can find you." />
    </>
  );
}
