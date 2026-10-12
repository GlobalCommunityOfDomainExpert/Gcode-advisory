import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { ButtonLink } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import { AboutText, BookCard, Chips, ExpList, Intro, RailCard, ReviewsBlock, Section, ServiceList, type ServiceItem } from "@/components/profile-view/kit";
import { ShareButton } from "@/components/profile-view/share-button";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import { clientIp } from "@/lib/server/guard";
import { hit } from "@/lib/server/rate-limit";
import { fmtDay, fmtTime, rupees } from "@/lib/booking/time";
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

const ENGAGEMENT = { PAID: "Paid sessions", FREE: "Free sessions", COMMUNITY: "Community member" } as const;

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
  const e = res.data;
  const mine = session?.userId === e.userId;
  const free = !e.paymentsEnabled || e.engagement === "FREE";
  const canBook = e.bookable && e.services.length > 0 && !mine;
  const next = e.services.map((s) => s.nextSlotAt).filter((x): x is string => !!x).sort()[0] ?? null;
  const nextLabel = next ? `${fmtDay(next)} · ${fmtTime(next)}` : null;
  const from = e.services.length ? Math.min(...e.services.map((s) => s.priceMinor)) : 0;
  const bookHref = session ? `/book/${e.userId}` : "/sign-in";
  const priceText = (minor: number) => (minor === 0 ? "Free" : rupees(minor));
  const duration = (m: number) => (m === 60 ? "1 hr" : `${m} min`);

  const services: ServiceItem[] = e.services.map((s) => ({
    key: s.id,
    name: s.title,
    desc: s.description,
    duration: duration(s.durationMin),
    price: priceText(s.priceMinor),
    free: s.priceMinor === 0,
    next: s.nextSlotAt ? `Next: ${fmtDay(s.nextSlotAt)} · ${fmtTime(s.nextSlotAt)}` : null,
    href: session ? `/book/${e.userId}?service=${s.id}` : "/sign-in",
    cta: session ? "Book" : "Sign in",
  }));

  const actions = mine ? (
    <>
      <ButtonLink href="/profile/view">Back to my profile</ButtonLink>
      <ShareButton title={`${e.name} on GCODE`} />
    </>
  ) : (
    <>
      {canBook ? (
        <ButtonLink href={bookHref}>
          <CalendarCheck className="size-4" aria-hidden="true" /> {session ? "Book a session" : "Sign in to book"}
        </ButtonLink>
      ) : (
        <span className="bg-bg-light text-text-secondary text-small rounded-sm px-4 py-2.5 font-bold">Not accepting bookings</span>
      )}
      <ShareButton title={`${e.name} on GCODE`} />
    </>
  );

  const orgs = [e.career[0]?.org, e.education[0]?.institution].filter((x): x is string => !!x);
  const none = { owner: false, editHref: "" } as const;

  return (
    <div className="space-y-4 pt-6 pb-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-5">
          <Intro
            name={e.name}
            headline={e.headline}
            location={e.location}
            photoUrl={e.photoUrl}
            roleLabel="Domain Expert"
            availability={e.status === "BOOKABLE" && nextLabel ? `Next available · ${nextLabel}` : null}
            engagement={e.engagement === "COMMUNITY" ? ENGAGEMENT.COMMUNITY : e.engagement ? (free ? ENGAGEMENT.FREE : ENGAGEMENT.PAID) : null}   // while payments are off, every session is free
            orgs={orgs}
            rating={e.rating}
            actions={actions}
          />
          <Section title="About" has={!!(e.pitch || e.bio)} prompt="" {...none}>
            <AboutText pitch={e.pitch} bio={e.bio} />
          </Section>
          <Section
            title="Services"
            has={services.length > 0}
            prompt=""
            sub={canBook ? (free ? "Pick a slot and send a request. The expert has 24 hours to accept." : "Pick a slot and send a request. You pay only after the expert accepts.") : undefined}
            {...none}
          >
            <ServiceList items={services} />
          </Section>
          <Section title="Experience" has={e.career.length > 0} prompt="" {...none}>
            <ExpList items={e.career.map((c) => ({ title: c.title, sub: c.org, period: c.period, desc: c.desc }))} />
          </Section>
          <Section title="Education" has={e.education.length > 0} prompt="" {...none}>
            <ExpList items={e.education.map((x) => ({ title: x.institution, sub: x.degree, period: x.period }))} />
          </Section>
          <Section title="Expertise" has={e.domains.length > 0} prompt="" {...none}>
            <Chips items={e.domains} />
          </Section>
          <Section title="Skills & tools" has={e.skills.length > 0} prompt="" {...none}>
            <Chips items={e.skills} />
          </Section>
          {e.rating && e.reviews && <ReviewsBlock count={e.rating.count} average={e.rating.average} items={e.reviews} />}
        </div>

        <aside className="lg:self-stretch">
          <div className="space-y-5 lg:sticky lg:top-4">
            {canBook ? (
              <BookCard
                price={priceText(from)}
                free={free}
                next={nextLabel}
                rows={services.map((s) => ({ key: s.key, name: s.name, detail: s.duration, price: s.price, href: s.href }))}
                cta={
                  <ButtonLink href={bookHref} className="w-full">
                    <CalendarCheck className="size-4" aria-hidden="true" /> {session ? "Book a session" : "Sign in to book"}
                  </ButtonLink>
                }
                note={
                  <>
                    {free ? "The expert has 24 hours to accept your request." : "You pay only after the expert accepts your request."}
                    {!session && (
                      <>
                        {" "}
                        New here?{" "}
                        <Link href="/sign-up" className="text-primary font-semibold underline underline-offset-2">
                          Create an account
                        </Link>
                        .
                      </>
                    )}
                  </>
                }
              />
            ) : (
              <RailCard title={mine ? "Your public profile" : e.status === "COMMUNITY" ? "Community member" : "Not bookable yet"}>
                <p className="text-small text-text-secondary">
                  {mine
                    ? "This is how visitors see your profile."
                    : e.status === "COMMUNITY"
                      ? `${e.name} shares knowledge with the community and isn’t offering sessions.`
                      : e.status === "PAID_SOON"
                        ? `${e.name} offers paid sessions, which open soon.`
                        : `${e.name} hasn’t set up availability yet.`}
                </p>
                {!mine && (
                  <ButtonLink href="/directory" variant="outline" size="sm" className="mt-4">
                    Find another expert
                  </ButtonLink>
                )}
              </RailCard>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
