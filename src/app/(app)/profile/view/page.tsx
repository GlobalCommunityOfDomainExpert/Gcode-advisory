import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Globe, Link as LinkIcon, Mail, Pencil, Phone } from "lucide-react";
import { Avatar, ButtonLink, Progress } from "@/components/atoms";
import { Banner, EmptyState } from "@/components/molecules";
import { AboutText, Chips, ExpList, Intro, RailCard, ReviewsBlock, Section, ServiceList, type ServiceItem } from "@/components/profile-view/kit";
import { PublishControl } from "@/components/profile-view/publish-control";
import { ShareButton } from "@/components/profile-view/share-button";
import { getSession } from "@/lib/server/session";
import { siteOrigin } from "@/lib/server/env";
import { loadProfile } from "@/lib/server/profile";
import { ords } from "@/lib/server/ords";
import { DAY_LABEL } from "@/lib/profile/services";
import { fmtDay, fmtTime } from "@/lib/booking/time";
import { DAY_KEYS, ROLE_BY_NAME, ROLE_LABEL, type ProfileDoc, type Service } from "@/lib/profile/types";
import type { PublicExpert, ReviewSummary } from "@/lib/booking/types";

export const metadata: Metadata = { title: "My profile" };

const clean = (s: string | undefined) => (s ?? "").trim();

const editTab = (tab: string) => `/profile?tab=${tab}`;

/** A section of the owner's view: its pencil and its "Add" prompt go to the matching tab of the editor. */
function OwnerSection(p: { title: string; has: boolean; tab: string; prompt: string; sub?: string; children: React.ReactNode }) {
  return (
    <Section title={p.title} has={p.has} owner editHref={editTab(p.tab)} prompt={p.prompt} sub={p.sub}>
      {p.children}
    </Section>
  );
}

const ENGAGEMENT: Record<string, string> = { paid: "Paid sessions", free: "Free sessions", community: "Community member" };

/** "Mon, Wed · 10:00-12:00" from a service's weekly hours. */
function whenText(s: Service): string {
  const on = DAY_KEYS.filter((k) => s.days[k].on);
  if (!on.length) return "No days set";
  const first = s.days[on[0]];
  return `${on.map((k) => DAY_LABEL[k]).join(", ")} · ${first.s}-${first.e}`;
}

const rateText = (s: Service, paymentsEnabled: boolean) => (s.rate === "" || s.rate === "0" ? "Free" : paymentsEnabled ? `₹${s.rate}` : "Paid (coming soon)");

function Fact({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-small text-text-secondary">{label}</dt>
      <dd className="text-body text-text-primary mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

/**
 * My profile (view), laid out like the wireframe's owner view: the photo-forward intro, then a card per section with a pencil
 * and an "Add" prompt where a section is empty, and a rail with the profile status (publish or take down) and the public link.
 * What visitors see is /experts/<slug>. Ratings received show in the intro and a Reviews block. Nothing here that the sprints have not built (no analytics or suggestions).
 */
export default async function ProfileViewPage() {
  const session = await getSession();
  const role = session && ROLE_BY_NAME[session.roleName];
  if (!session || !role) redirect("/sign-in");

  const loaded = await loadProfile({ session, role });
  if (!loaded) return <EmptyState title="We couldn’t load your profile" description="Please refresh the page in a moment." />;

  const doc: ProfileDoc = loaded.profile;
  const f = (k: string) => clean(doc.fields[k]);
  const pct = loaded.completion.pct;
  const complete = pct === 100;
  const isOrg = role === "institute";
  const isPerson = role === "expert" || role === "intern";
  const name = (isOrg ? f("instName") : f("fullName")) || (isOrg ? "Your institute" : "Your name");
  const headline = isOrg ? f("instType") : isPerson ? f("currentTitle") : role === "startup" ? "Startup / MSME" : "";
  const photo = doc.files.photo?.url ?? doc.files.logo?.url;
  const publicUrl = doc.publicSlug ? `${siteOrigin()}/experts/${doc.publicSlug}` : null;

  const career = doc.lists.career.filter((c) => clean(c.title));
  const education = doc.lists.education.filter((e) => clean(e.institution));
  const projects = doc.lists.projects.filter((p) => clean(p.title));
  const contacts = doc.lists.contacts.filter((c) => clean(c.name));
  const services = doc.services.filter((s) => clean(s.type));
  const orgs = isPerson ? [career[0]?.org, education[0]?.institution].filter((x): x is string => !!x) : [];

  // The next free time, only for a published expert (the public page already knows it).
  let availability: string | null = null;
  if (role === "expert" && doc.published && doc.publicSlug) {
    const pub = await ords<PublicExpert>(`/directory/public/${encodeURIComponent(doc.publicSlug)}`);
    const next = pub.ok ? pub.data.services.map((s) => s.nextSlotAt).filter((x): x is string => !!x).sort()[0] : null;
    if (next) availability = `Next available · ${fmtDay(next)} · ${fmtTime(next)}`;
  }

  // The ratings this person has received (as an expert from bookers, as a booker from experts). Nothing is shown until there is one.
  const reviews = await ords<ReviewSummary>("/bookings/reviews", { token: session.token });
  const received = reviews.ok && reviews.data.count > 0 && reviews.data.average !== undefined ? reviews.data : null;

  const serviceItems: ServiceItem[] = services.map((s, i) => ({
    key: i,
    name: s.type,
    desc: clean(s.contribution) || null,
    duration: s.duration,
    price: rateText(s, doc.paymentsEnabled),
    free: s.rate === "" || s.rate === "0",
    when: whenText(s),
    href: editTab("services"),
    cta: "Edit",
  }));

  const editTabForIntro = role === "expert" ? "expertise" : isPerson ? "profile" : role === "startup" ? "company" : "info";
  const actions = (
    <>
      <ButtonLink href={editTab(editTabForIntro)}>
        <Pencil className="size-4" aria-hidden="true" /> Edit profile
      </ButtonLink>
      {role === "expert" && (
        <ButtonLink href="/profile/preview" variant="outline">
          Preview
        </ButtonLink>
      )}
      {doc.published && doc.publicSlug && publicUrl && <ShareButton title={`${name} on GCODE`} url={publicUrl} />}
    </>
  );

  const hiddenBanner = !doc.published ? (
    <Banner tone="warning">
      <span className="flex flex-wrap items-center justify-between gap-3">
        <span>
          <b>Hidden from others.</b> {complete ? "Nobody can see or book this profile until you publish it." : "Finish your profile, then publish it."}
        </span>
      </span>
    </Banner>
  ) : null;

  return (
    <div className="space-y-4 pt-6 pb-8">
      {hiddenBanner}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-5">
          <Intro
            name={name}
            headline={headline || null}
            location={f("location") || null}
            photoUrl={photo}
            roleLabel={ROLE_LABEL[role]}
            availability={availability}
            engagement={role === "expert" && f("engagement") ? (f("engagement") === "paid" && !doc.paymentsEnabled ? ENGAGEMENT.free : ENGAGEMENT[f("engagement")]) : null}
            orgs={orgs}
            editHref={editTab(editTabForIntro)}
            rating={received ? { average: received.average as number, count: received.count } : null}
            actions={actions}
          />

          {role === "expert" && (
            <>
              <OwnerSection title="About" has={!!(f("pitch") || f("bio"))} tab="about" prompt="Add a one-line pitch and tell people about your background.">
                <AboutText pitch={f("pitch")} bio={f("bio")} />
              </OwnerSection>
              <OwnerSection
                title="Services"
                has={services.length > 0}
                tab="services"
                prompt={f("engagement") === "community" ? "You joined as a community member, so you can’t be booked." : "Add a service and availability so people can book you."}
              >
                <ServiceList items={serviceItems} />
              </OwnerSection>
            </>
          )}

          {role === "intern" && (
            <>
              <OwnerSection title="About" has={!!(f("pitch") || f("bio"))} tab="profile" prompt="Add a one-line pitch and tell people about yourself.">
                <AboutText pitch={f("pitch")} bio={f("bio")} />
              </OwnerSection>
              <OwnerSection title="Projects" has={projects.length > 0} tab="projects" prompt="Show what you’ve built.">
                <div className="grid gap-4 sm:grid-cols-2">
                  {projects.map((p, i) => (
                    <div key={i} className="bg-bg-subtle border-border-light rounded-md border p-5">
                      <h3 className="text-body text-text-primary font-semibold">{p.title}</h3>
                      {clean(p.desc) && <p className="text-small text-text-secondary mt-1 leading-relaxed">{p.desc}</p>}
                      {clean(p.link) && (
                        <p className="text-small text-primary mt-3 flex items-center gap-1.5 font-medium">
                          <LinkIcon className="size-3.5" aria-hidden="true" />
                          {p.link}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </OwnerSection>
            </>
          )}

          {role === "startup" && (
            <>
              <OwnerSection title="About" has={!!f("pitch")} tab="pitch" prompt="Explain what you’re building in a sentence.">
                <AboutText bio={f("pitch")} />
              </OwnerSection>
              <OwnerSection title="Company" has={[f("stage"), f("funding"), f("teamSize"), f("industry"), f("location")].some(Boolean)} tab="company" prompt="Add stage, funding, team size and industry.">
                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <Fact label="Startup stage" value={f("stage")} />
                  <Fact label="Funding status" value={f("funding")} />
                  <Fact label="Team size" value={f("teamSize") ? `${f("teamSize")} people` : ""} />
                  <Fact label="Industry" value={f("industry")} />
                  <Fact label="Location" value={f("location")} />
                </dl>
              </OwnerSection>
              <OwnerSection title="Team & contacts" has={contacts.length > 0} tab="team" prompt="Add who people should contact.">
                <div className="grid gap-4 sm:grid-cols-2">
                  {contacts.map((c, i) => (
                    <div key={i} className="bg-bg-subtle ring-primary/5 rounded-md p-5 ring-1">
                      <div className="flex items-center gap-3">
                        <Avatar alt={c.name} size="lg" />
                        <div className="min-w-0">
                          <p className="text-body text-text-primary truncate font-semibold">{c.name}</p>
                          <p className="text-small text-text-secondary truncate">{c.role}</p>
                        </div>
                      </div>
                      <div className="text-small text-text-secondary mt-4 space-y-1.5">
                        {clean(c.email) && (
                          <p className="flex items-center gap-2">
                            <Mail className="size-4" aria-hidden="true" />
                            {c.email}
                          </p>
                        )}
                        {clean(c.phone) && (
                          <p className="flex items-center gap-2">
                            <Phone className="size-4" aria-hidden="true" />
                            {c.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </OwnerSection>
            </>
          )}

          {role === "institute" && (
            <>
              <OwnerSection title="About" has={!!f("about")} tab="info" prompt="Describe your institute.">
                <AboutText bio={f("about")} />
              </OwnerSection>
              <OwnerSection title="Institute" has={!!(f("instType") || f("website"))} tab="info" prompt="Add type and website.">
                <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <Fact label="Type of institute" value={f("instType")} />
                  <Fact label="Official website" value={f("website")} />
                </dl>
              </OwnerSection>
            </>
          )}

          {isPerson && (
            <>
              <OwnerSection title="Experience" has={career.length > 0} tab="journey" prompt={role === "intern" ? "Add internships or jobs." : "Add where you’ve worked."}>
                <ExpList items={career.map((c) => ({ title: c.title, sub: c.org, period: c.period, desc: c.desc }))} />
              </OwnerSection>
              <OwnerSection title="Education" has={education.length > 0} tab="journey" prompt={role === "intern" ? "Add where you study." : "Add where you studied."}>
                <ExpList items={education.map((e) => ({ title: e.institution, sub: e.degree, period: e.period }))} />
              </OwnerSection>
              {role === "expert" && (
                <OwnerSection title="Expertise" has={doc.lists.domains.length > 0} tab="expertise" prompt="Pick your primary domains.">
                  <Chips items={doc.lists.domains} />
                </OwnerSection>
              )}
              <OwnerSection title="Skills & tools" has={doc.lists.skills.length > 0} tab={role === "expert" ? "expertise" : "profile"} prompt="Add skills and tools.">
                <Chips items={doc.lists.skills} />
              </OwnerSection>
            </>
          )}
          {received && <ReviewsBlock count={received.count} average={received.average} items={received.items} />}
        </div>

        <aside className="lg:self-stretch">
          <div className="space-y-5 lg:sticky lg:top-4">
            {role === "startup" && (f("linkedin") || f("domain")) && (
              <RailCard title="Links">
                <div className="text-body text-primary space-y-3 font-medium">
                  {f("linkedin") && (
                    <p className="flex items-center gap-2.5">
                      <LinkIcon className="text-text-secondary size-4" aria-hidden="true" />
                      <span className="truncate">{f("linkedin")}</span>
                    </p>
                  )}
                  {f("domain") && (
                    <p className="flex items-center gap-2.5">
                      <Globe className="text-text-secondary size-4" aria-hidden="true" />
                      <span className="truncate">{f("domain")}</span>
                    </p>
                  )}
                </div>
              </RailCard>
            )}
            {role === "institute" && f("cName") && (
              <RailCard title="Contact">
                <div className="flex items-center gap-3">
                  <Avatar alt={f("cName")} size="lg" />
                  <div className="min-w-0">
                    <p className="text-body text-text-primary truncate font-semibold">{f("cName")}</p>
                    <p className="text-small text-text-secondary">Contact person</p>
                  </div>
                </div>
                <div className="text-small text-text-secondary mt-4 space-y-1.5">
                  {f("cEmail") && (
                    <p className="flex items-center gap-2">
                      <Mail className="size-4" aria-hidden="true" />
                      {f("cEmail")}
                    </p>
                  )}
                  {f("cPhone") && (
                    <p className="flex items-center gap-2">
                      <Phone className="size-4" aria-hidden="true" />
                      {f("cPhone")}
                    </p>
                  )}
                </div>
              </RailCard>
            )}

            <RailCard title="Profile status">
              <div className="text-small flex items-center justify-between">
                <span className={`${complete ? "text-success" : "text-text-primary"} font-semibold`}>{complete ? "Profile complete" : "Profile completion"}</span>
                <span className="text-text-primary font-bold tabular-nums">{pct}%</span>
              </div>
              <div className="mt-2">
                <Progress value={pct} label="Profile completion" tone={complete ? "success" : "primary"} />
              </div>
              <div className="mt-4">
                {complete ? (
                  <>
                    <p className={`text-small mb-3 font-semibold ${doc.published ? "text-success" : "text-text-secondary"}`}>
                      {doc.published ? `Published: visible in ${role === "expert" ? "Find experts" : "the community"}` : "Not published: hidden from others"}
                    </p>
                    <PublishControl published={doc.published} complete />
                  </>
                ) : (
                  <>
                    <p className="text-small text-text-secondary">Hidden from others until it’s complete and published.</p>
                    <ButtonLink href="/profile" size="sm" className="mt-3 w-full">
                      Continue profile
                    </ButtonLink>
                  </>
                )}
              </div>
            </RailCard>

            {role === "expert" && (
              <RailCard title="Public profile & URL">
                {doc.published && publicUrl ? (
                  <>
                    <p className="text-small text-primary flex items-center gap-2 font-medium">
                      <LinkIcon className="text-text-secondary size-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{publicUrl.replace(/^https?:\/\//, "")}</span>
                    </p>
                    <p className="text-small text-text-secondary mt-2">Anyone can open this link, even without an account.</p>
                  </>
                ) : (
                  <p className="text-small text-text-secondary">Your public link goes live when you publish.</p>
                )}
              </RailCard>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
