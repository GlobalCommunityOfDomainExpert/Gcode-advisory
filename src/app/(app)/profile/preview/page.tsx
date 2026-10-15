import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Eye, Pencil } from "lucide-react";
import { ButtonLink } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import { ExpertPublicView } from "@/components/profile-view/expert-public-view";
import { PublishControl } from "@/components/profile-view/publish-control";
import { getSession } from "@/lib/server/session";
import { loadProfile } from "@/lib/server/profile";
import { ROLE_BY_NAME, type ProfileDoc } from "@/lib/profile/types";
import type { BookableService, PublicExpert } from "@/lib/booking/types";

export const metadata: Metadata = { title: "Preview your profile" };

const clean = (s: string | undefined) => (s ?? "").trim();

/** "30 min" -> 30, "1 hr" -> 60, "No buffer" -> 0. */
function minutes(label: string): number {
  if (/hr/i.test(label)) return 60 * (parseFloat(label) || 1);
  return parseInt(label, 10) || 0;
}

/** What the public page would be made from, using the saved profile instead of the published one. No next-slot times: nothing is bookable from a preview. */
function toPublic(doc: ProfileDoc, userId: string, name: string): PublicExpert {
  const f = (k: string) => clean(doc.fields[k]);
  const engagement = f("engagement").toUpperCase();
  const eng = engagement === "PROVIDER" || engagement === "COMMUNITY" ? engagement : null;
  const services: BookableService[] = doc.services
    .filter((s) => clean(s.type))
    .map((s, i) => ({
      id: i + 1,
      title: s.type,
      description: clean(s.contribution) || null,
      durationMin: minutes(s.duration),
      bufferMin: minutes(s.buffer),
      priceMinor: s.rate === "" || s.rate === "0" ? 0 : Number(s.rate) * 100,
      nextSlotAt: null,
    }));
  const bookable = eng !== "COMMUNITY" && services.length > 0;
  return {
    userId,
    slug: doc.publicSlug ?? "preview",
    name,
    photoUrl: doc.files.photo?.url ?? null,
    headline: f("currentTitle") || null,
    location: f("location") || null,
    bio: f("bio") || null,
    pitch: f("pitch") || null,
    bookable,
    engagement: eng,
    status: eng === "COMMUNITY" ? "COMMUNITY" : bookable ? "BOOKABLE" : "NO_SERVICE",
    skills: doc.lists.skills,
    domains: doc.lists.domains,
    career: doc.lists.career.filter((c) => clean(c.title)).map((c) => ({ title: c.title, org: clean(c.org) || null, period: clean(c.period) || null, desc: clean(c.desc) || null })),
    education: doc.lists.education.filter((x) => clean(x.institution)).map((x) => ({ institution: x.institution, degree: clean(x.degree) || null, period: clean(x.period) || null })),
    services,
    paymentsEnabled: doc.paymentsEnabled,
  };
}

/**
 * "Preview" before publishing: the expert's own public page, built from what they have saved, exactly as visitors will see it.
 * Nothing can be booked or shared from here. The bar on top says it is a preview and carries Publish (once the profile is complete)
 * and the way back to editing. Only experts have a public page; everyone else's profile view is already the preview.
 */
export default async function ProfilePreviewPage() {
  const session = await getSession();
  const role = session && ROLE_BY_NAME[session.roleName];
  if (!session || !role) redirect("/sign-in");
  if (role !== "expert") redirect("/profile/view");

  const loaded = await loadProfile({ session, role });
  if (!loaded) return <EmptyState title="We couldn’t load your profile" description="Please refresh the page in a moment." />;
  const doc = loaded.profile;
  const complete = loaded.completion.pct === 100;
  const name = clean(doc.fields.fullName) || "Your name";

  const banner = (
    <div role="status" className="bg-primary-light flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md px-5 py-4">
      <span className="text-primary">
        <Eye className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body text-text-primary font-semibold">{doc.published ? "Preview of your live profile" : "Preview: this is how visitors will see your profile"}</p>
        <p className="text-small text-text-secondary">
          {doc.published
            ? "This is your saved profile. Visitors see it at your public link."
            : complete
              ? "It’s hidden until you publish it. Nothing can be booked from this preview."
              : `It’s ${loaded.completion.pct}% complete. Finish it to publish. Nothing can be booked from this preview.`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink href="/profile" variant="outline" size="sm">
          <Pencil className="size-4" aria-hidden="true" /> Back to editing
        </ButtonLink>
        <div className="w-40">
          <PublishControl published={doc.published} complete={complete} />
        </div>
      </div>
    </div>
  );

  return <ExpertPublicView e={toPublic(doc, session.userId, name)} session={null} preview banner={banner} />;
}
