import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/molecules";
import { ExpertPublicView } from "@/components/profile-view/expert-public-view";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import { clientIp } from "@/lib/server/guard";
import { hit } from "@/lib/server/rate-limit";
import type { PublicExpert } from "@/lib/booking/types";

const SLUG = /^[a-zA-Z0-9-]{1,60}$/;

const load = (slug: string) => ords<PublicExpert>(`/directory/public/${encodeURIComponent(slug)}`);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!SLUG.test(slug)) return { title: "Expert not found" };
  const res = await load(slug);
  if (!res.ok) return { title: "Expert not found", robots: { index: false } };
  const e = res.data;
  const title = e.headline ? `${e.name}, ${e.headline}` : e.name;
  const description = (e.pitch || e.bio || `Book a session with ${e.name} on GCODE.`).slice(0, 200);
  return { title, description, openGraph: { title, description, type: "profile" }, robots: { index: true, follow: true } };
}

/**
 * An expert's public page, at /experts/<slug>, laid out like the wireframe's visitor profile. Anyone can open it, signed in
 * or not; only published experts have one. Signed-out visitors are sent to sign in to book. Contact details are never shown
 * (there are none in the data). Sections with nothing in them are hidden.
 */
export default async function PublicExpertPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG.test(slug)) notFound();

  const ip = clientIp(new Request("http://x", { headers: await headers() }));
  if (!hit(`public-profile:${ip}`, 120, 10 * 60).allowed) {
    return <EmptyState title="Too many requests" description="Please wait a few minutes and try again." />;
  }

  const [res, session] = await Promise.all([load(slug), getSession()]);
  if (!res.ok) {
    if (res.status === 404) notFound();
    return <EmptyState title="We couldn’t load this profile" description="Please refresh the page in a moment." />;
  }
  return <ExpertPublicView e={res.data} session={session} />;
}
