import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, ChevronRight, LayoutDashboard, LucideIcon, Search, UserRound, Wallet } from "lucide-react";
import { Badge, ButtonLink, Icon, Progress, SectionLabel } from "@/components/atoms";
import { PageHeader } from "@/components/layout";
import { EmptyState } from "@/components/molecules";
import { PublishControl } from "@/components/profile-view/publish-control";
import { dateColumn, fmtDay, fmtTime, rupees } from "@/lib/booking/time";
import { statusText, STATUS_TONE } from "@/lib/booking/status";
import type { BookingList, BookingView, Earnings } from "@/lib/booking/types";
import { ROLE_BY_NAME } from "@/lib/profile/types";
import { ords } from "@/lib/server/ords";
import { loadProfile } from "@/lib/server/profile";
import { getSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Dashboard" };

const IST = "Asia/Kolkata";

/** "Good morning" by the hour in India, wherever the server runs. */
function greeting(now = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "numeric", hour12: false }).format(now)) % 24;
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** Whole IST calendar days from today to a date: 0 today, 1 tomorrow. */
function daysUntil(iso: string, now = new Date()): number {
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(d);
  return Math.round((Date.parse(day(new Date(iso))) - Date.parse(day(now))) / 86_400_000);
}

/** Hours from now to a time. */
const hoursUntil = (iso: string, now = new Date()) => (Date.parse(iso) - now.getTime()) / 3_600_000;

const inDays = (n: number) => (n <= 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`);

interface Focus {
  eyebrow: string;
  value: string;
  label: string;
  text: string;
  /** Incomplete profile: the red urgent look with a progress bar. */
  ring?: number;
  primary: { label: string; href: string } | "publish";
  secondary?: { label: string; href: string };
  published?: boolean;
  complete?: boolean;
}

interface NextStep {
  icon: LucideIcon;
  title: string;
  text: string;
  action: string;
  href: string;
}

/** The one thing that needs you. Calm: one figure, one sentence, one main action. */
function FocusTile({ f }: { f: Focus }) {
  const urgent = f.ring !== undefined;
  return (
    <section className={`${urgent ? "bg-secondary-light ring-secondary/25" : "bg-primary-light ring-primary/10"} rounded-lg p-6 ring-1 sm:p-8`}>
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
        <div className="min-w-0 flex-1 basis-72">
          <SectionLabel className={urgent ? "text-secondary!" : "text-primary!"}>{f.eyebrow}</SectionLabel>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`text-display ${urgent ? "text-secondary" : "text-primary"} leading-none font-extrabold tracking-tight tabular-nums`}>{f.value}</span>
            <span className="text-large text-text-primary font-semibold">{f.label}</span>
          </div>
          <p className="text-body text-text-secondary mt-2 max-w-xl">{f.text}</p>
          {f.ring !== undefined && (
            <div className="mt-4 max-w-xs">
              <Progress value={f.ring} label="Profile completion" tone="secondary" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {f.primary === "publish" ? (
            <div className="w-44">
              <PublishControl published={!!f.published} complete={!!f.complete} />
            </div>
          ) : (
            <ButtonLink href={f.primary.href} variant={urgent ? "accent" : "primary"}>
              {f.primary.label} <Icon icon={ArrowRight} size="sm" />
            </ButtonLink>
          )}
          {f.secondary && (
            <ButtonLink href={f.secondary.href} variant="secondary">
              {f.secondary.label}
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}

/** Three plain numbers in one card, divided by hairlines: label, value, one line of context. */
function Stats({ items }: { items: { label: string; value: string; sub: string }[] }) {
  return (
    <dl className="bg-surface-light divide-border-light ring-primary/10 grid divide-y rounded-lg shadow-sm ring-1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {items.map((s) => (
        <div key={s.label} className="px-6 py-5">
          <dt className="text-small text-text-secondary font-medium">{s.label}</dt>
          <dd className="text-heading text-text-primary mt-1 leading-none font-extrabold tracking-tight tabular-nums">{s.value}</dd>
          <dd className="text-small text-text-secondary mt-1.5">{s.sub}</dd>
        </div>
      ))}
    </dl>
  );
}

function Upcoming({ items, isExpert }: { items: BookingView[]; isExpert: boolean }) {
  return (
    <section className="bg-surface-light ring-primary/10 rounded-lg p-6 shadow-sm ring-1 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body text-text-primary font-bold tracking-tight">Upcoming sessions</h2>
        {items.length > 0 && (
          <Link href="/bookings" className="text-small text-primary rounded-sm font-semibold hover:underline">
            View all
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled"
          description={isExpert ? "Confirmed sessions will show up here." : "Find an expert and book your first 1:1 session."}
          action={
            isExpert ? undefined : (
              <ButtonLink href="/directory" size="sm">
                <Icon icon={Search} size="sm" /> Find an expert
              </ButtonLink>
            )
          }
        />
      ) : (
        <ul className="-mx-3 mt-3">
          {items.map((b) => {
            const d = dateColumn(b.startAt);
            const who = b.role === "requester" ? b.expertName : b.requesterName;
            return (
              <li key={b.id}>
                <Link href="/bookings" className="group hover:bg-bg-subtle focus-visible:ring-primary flex items-center gap-4 rounded-md px-3 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none">
                  <span className="border-border-hover bg-surface-light flex h-14 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-md border leading-none">
                    <span className="text-primary text-[0.7rem] font-semibold tracking-wide uppercase">{d.month}</span>
                    <span className="text-large text-primary font-extrabold">{d.day}</span>
                  </span>
                  <span className="block min-w-0 flex-1">
                    <span className="text-body text-text-primary block truncate font-semibold">{b.serviceTitle}</span>
                    <span className="text-small text-text-secondary block truncate">
                      {b.role === "requester" ? "with" : "requested by"} {who} · {fmtDay(b.startAt)}, {fmtTime(b.startAt)} · {b.durationMin} min
                    </span>
                  </span>
                  <span className="hidden shrink-0 sm:block">
                    <Badge tone={b.reschedule ? "warning" : STATUS_TONE[b.status]}>{statusText(b)}</Badge>
                  </span>
                  <Icon icon={ChevronRight} size="sm" className="text-text-secondary shrink-0 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function NextStepCard({ n }: { n: NextStep }) {
  return (
    <aside className="bg-surface-light ring-primary/10 rounded-lg p-6 shadow-sm ring-1">
      <SectionLabel>Next step</SectionLabel>
      <h2 className="text-body text-text-primary mt-3 flex items-center gap-2 font-bold tracking-tight">
        <Icon icon={n.icon} size="sm" className="text-primary shrink-0" />
        {n.title}
      </h2>
      <p className="text-small text-text-secondary mt-1.5 leading-relaxed">{n.text}</p>
      <ButtonLink href={n.href} variant="outline" className="mt-4 w-full">
        {n.action} <Icon icon={ArrowRight} size="sm" />
      </ButtonLink>
    </aside>
  );
}

/**
 * The member's home, as in the wireframe, kept deliberately quiet: greeting, ONE thing that needs you, three plain numbers, what is
 * coming up, one next step. It follows the member's state: an incomplete profile asks to finish setup, a complete one asks to
 * publish, then pending answers, then the next session, then an invitation. Everything comes from the same APIs as My bookings,
 * Payouts and My profile.
 */
export default async function DashboardPage() {
  const session = await getSession();
  const role = session && ROLE_BY_NAME[session.roleName];
  if (!session || !role) redirect("/sign-in");
  const isExpert = role === "expert";

  const [profile, upcoming, earnings] = await Promise.all([
    loadProfile({ session, role }),
    ords<BookingList>("/bookings/me?tab=upcoming&page_len=100", { token: session.token }),
    isExpert ? ords<Earnings>("/payouts/earnings", { token: session.token }) : Promise.resolve(null),
  ]);
  if (!profile) return <EmptyState icon={LayoutDashboard} title="We couldn’t load your dashboard" description="Please refresh the page in a moment." />;

  const first = (session.fullName || "").trim().split(/\s+/)[0] || "there";
  const items = upcoming.ok ? upcoming.data.items : [];
  const completed = upcoming.ok ? upcoming.data.counts.completed : 0;
  const pct = profile.completion.pct;
  const doc = profile.profile;
  const complete = pct === 100;
  const previewHref = isExpert ? "/profile/preview" : "/profile/view";

  const confirmed = items.filter((b) => b.status === "SCHEDULED");
  const mustAnswer = items.filter((b) => (b.role === "expert" && b.status === "PENDING") || (!!b.reschedule && !b.reschedule.byMe));
  const awaiting = items.filter((b) => b.role === "requester" && b.status === "PENDING");
  const requests = mustAnswer.filter((b) => b.status === "PENDING").length;
  const shown = items.filter((b) => b.status === "SCHEDULED" || (b.role === "requester" && b.status === "PENDING")).slice(0, 4);
  const next = confirmed[0];
  const where = isExpert ? "Find an expert" : "the community";

  // ---- the focus: the first thing that applies ----
  let focus: Focus;
  let line: string;
  const firstOpen = profile.completion.per.find((p) => p.filled < p.total);
  if (!complete) {
    focus = {
      eyebrow: "Finish setup",
      value: `${pct}%`,
      label: "of your profile is complete",
      text: `Others can’t see${isExpert ? " or book" : ""} you until it’s complete and published.`,
      ring: pct,
      primary: { label: "Continue profile", href: "/profile" },
      secondary: { label: "Preview profile", href: previewHref },
    };
    line = "Finish your profile to go live.";
  } else if (!doc.published) {
    focus = {
      eyebrow: "Ready to go live",
      value: "100%",
      label: "profile complete",
      text: `Publish it to appear in ${where}. You can unpublish any time.`,
      primary: "publish",
      published: false,
      complete: true,
      secondary: { label: "Preview profile", href: previewHref },
    };
    line = "Your profile is ready. Publish it to be found.";
  } else if (mustAnswer.length > 0) {
    const reqs = requests > 0;
    focus = {
      eyebrow: "Needs your attention",
      value: String(mustAnswer.length),
      label: reqs ? (mustAnswer.length === 1 ? "booking request waiting" : "booking requests waiting") : mustAnswer.length === 1 ? "new time to answer" : "new times to answer",
      text: reqs ? "The person who booked is told as soon as you accept or decline. Requests expire after 24 hours." : "Accept the new time, or decline and the original time stands.",
      primary: { label: reqs ? "Review requests" : "Review", href: "/bookings" },
      secondary: isExpert ? { label: "Manage services", href: "/profile?tab=services" } : { label: "Find an expert", href: "/directory" },
    };
    line = `You have ${mustAnswer.length} ${mustAnswer.length === 1 ? "thing" : "things"} waiting for a reply.`;
  } else if (next) {
    const n = daysUntil(next.startAt);
    const who = next.role === "requester" ? next.expertName : next.requesterName;
    const soon = hoursUntil(next.startAt) < 2 && !!next.callSlug && next.actions.includes("join");      // the call page is only worth a button close to the start
    focus = {
      eyebrow: "Up next",
      value: inDays(n),
      label: `${next.serviceTitle} with ${who}`,
      text: `${fmtDay(next.startAt)}, ${fmtTime(next.startAt)} · ${next.durationMin} min.${soon ? " The room opens ten minutes before." : ""}`,
      primary: soon ? { label: "Open the call page", href: `/call/${next.callSlug}` } : { label: "View bookings", href: "/bookings" },
    };
    line = "Nothing needs your attention right now.";
  } else {
    focus = isExpert
      ? { eyebrow: "All caught up", value: "0", label: "booking requests yet", text: "Share your profile to get your first request.", primary: { label: "View my profile", href: "/profile/view" } }
      : { eyebrow: "Get started", value: "0", label: "sessions booked", text: "Find an expert and book your first 1:1 session.", primary: { label: "Find an expert", href: "/directory" } };
    line = "Nothing needs your attention right now.";
  }

  // ---- three plain numbers ----
  const money = (m: number) => (m === 0 ? "₹0" : rupees(m));
  const stats = [
    { label: "Confirmed sessions", value: String(confirmed.length), sub: next ? `Next: ${fmtDay(next.startAt)}, ${fmtTime(next.startAt)}` : "Nothing yet" },
    isExpert
      ? {
          label: "Earnings (net)",
          value: earnings?.ok ? money(earnings.data.lifetimeNetMinor) : "—",
          sub: earnings?.ok && earnings.data.lifetimeNetMinor > 0 ? "After the 15% platform fee" : "Nothing yet",
        }
      : { label: "Awaiting response", value: String(awaiting.length), sub: awaiting.length ? "Expert hasn’t replied yet" : "Nothing yet" },
    { label: "Sessions completed", value: String(completed), sub: completed ? "Since you joined" : "Nothing yet" },
  ];

  // ---- one next step ----
  const paidService = doc.services.some((s) => s.rate !== "" && Number(s.rate) > 0);
  let step: NextStep;
  if (!complete && firstOpen) {
    step = { icon: UserRound, title: `Complete “${firstOpen.label}”`, text: "Fill in what’s missing so people can find and trust you.", action: "Continue", href: `/profile?tab=${firstOpen.id}` };
  } else if (isExpert && doc.paymentsEnabled && paidService && !doc.payoutSet) {
    step = { icon: Wallet, title: "Add a payout account", text: "You need one to receive your earnings.", action: "Add account", href: "/settings?section=payouts" };
  } else if (isExpert && doc.services.length === 0) {
    step = { icon: CalendarDays, title: "Set up your services", text: "Add a service and your weekly hours so people can book you.", action: "Add a service", href: "/profile?tab=services" };
  } else if (isExpert) {
    step = { icon: UserRound, title: "Keep your profile fresh", text: "Experts with a clear pitch and current availability get more requests.", action: "Edit profile", href: "/profile" };
  } else {
    step = { icon: Search, title: "Find your next expert", text: "Browse experts with open slots this week.", action: "Browse experts", href: "/directory" };
  }

  return (
    <>
      <PageHeader eyebrow={new Intl.DateTimeFormat("en-GB", { timeZone: IST, weekday: "long", day: "numeric", month: "long" }).format(new Date())} title={`${greeting()}, ${first}`} subtitle={line} />
      <div className="grid grid-cols-1 gap-5 pb-8 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-12">
          <FocusTile f={focus} />
        </div>
        <div className="min-w-0 lg:col-span-12">
          <Stats items={stats} />
        </div>
        <div className="min-w-0 lg:col-span-8">
          <Upcoming items={shown} isExpert={isExpert} />
        </div>
        <div className="min-w-0 lg:col-span-4">
          <NextStepCard n={step} />
        </div>
      </div>
    </>
  );
}
