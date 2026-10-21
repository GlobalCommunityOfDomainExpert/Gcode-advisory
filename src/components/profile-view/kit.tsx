import Link from "next/link";
import { Cover } from "./cover";
import { ReactNode } from "react";
import { ArrowRight, BadgeCheck, CalendarDays, Clock, MapPin, Pencil, Plus, ShieldCheck, Sparkles, Star, Video, ChevronRight } from "lucide-react";
import { Avatar, ButtonLink } from "@/components/atoms";
import { initials } from "@/lib/initials";

/**
 * The building blocks of the profile view and the public page, from the wireframe's profile kit
 * (wireframe-sprints/src/components/molecules/profile-kit.js): soft cards, a photo-forward intro with a tinted cover, service
 * cards that are one big link, experience rows with initials tiles, chips, and the sticky booking card.
 * Pure presentation: no data fetching in here.
 */

export const ProfileCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`bg-surface-light border-border-light min-w-0 rounded-md border shadow-xs ${className}`}>{children}</section>
);

/** The small pencil at the top right of a section, for the owner. */
function EditLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="text-text-secondary hover:bg-bg-light hover:text-text-primary focus-visible:ring-primary -mt-1.5 -mr-2 grid size-9 shrink-0 place-items-center rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none">
      <Pencil className="size-4" aria-hidden="true" />
    </Link>
  );
}

function Head({ title, sub, edit }: { title: string; sub?: string; edit?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-large text-text-primary font-bold tracking-tight">{title}</h2>
        {sub && <p className="text-small text-text-secondary mt-0.5">{sub}</p>}
      </div>
      {edit && <EditLink href={edit} label={`Edit ${title}`} />}
    </div>
  );
}

/** "Local E." style reviewer, a date and the stars. Shown only when there is at least one rating. */
export function ReviewsBlock({ count, average, items }: { count: number; average?: number; items: { stars: number; comment: string | null; from: string; createdAt: string }[] }) {
  if (count === 0 || average === undefined) return null;
  return (
    <ProfileCard>
      <div className="p-6 sm:p-7">
        <Head title="Reviews" sub={`${average.toFixed(1)} out of 5 from ${count} rating${count > 1 ? "s" : ""}`} />
        <ul className="divide-border-light mt-5 divide-y">
          {items.map((r, i) => (
            <li key={i} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span role="img" aria-label={`${r.stars} out of 5 stars`} className="inline-flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`size-4 ${n <= r.stars ? "text-warning fill-current" : "text-border-hover"}`} aria-hidden />
                  ))}
                </span>
                <span className="text-small text-text-primary font-semibold">{r.from}</span>
                <span className="text-small text-text-secondary">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</span>
              </div>
              {r.comment && <p className="text-body text-text-secondary mt-1.5 leading-relaxed">{r.comment}</p>}
            </li>
          ))}
        </ul>
      </div>
    </ProfileCard>
  );
}

/** A section card: shown when it has content; empty, the owner gets an "Add" prompt and a visitor sees nothing. */
export function Section({
  title,
  has,
  owner,
  editHref,
  prompt,
  sub,
  children,
}: {
  title: string;
  has: boolean;
  owner: boolean;
  editHref: string;
  prompt: string;
  sub?: string;
  children: ReactNode;
}) {
  if (!has && !owner) return null;
  return (
    <ProfileCard>
      <div className="p-6 sm:p-7">
        <Head title={title} sub={has ? sub : undefined} edit={has && owner ? editHref : undefined} />
        <div className="mt-5">
          {has ? (
            children
          ) : (
            <div className="border-border-hover bg-bg-subtle flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed p-4">
              <p className="text-small text-text-secondary">{prompt}</p>
              <ButtonLink href={editHref} variant="outline" size="sm">
                <Plus className="size-4" aria-hidden="true" /> Add
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </ProfileCard>
  );
}

/** Initials in a tile, the stand-in for an organisation's logo. */
export const OrgTile = ({ name, className = "size-12" }: { name: string; className?: string }) => (
  <span className={`${className} text-small bg-primary-light text-primary ring-primary/10 grid shrink-0 place-items-center rounded-sm font-bold ring-1`}>{initials(name)}</span>
);

export const Chips = ({ items }: { items: string[] }) => (
  <ul className="flex flex-wrap gap-2">
    {items.map((s) => (
      <li key={s} className="border-border-light bg-bg-subtle text-text-primary text-small rounded-sm border px-3 py-1.5 font-medium">
        {s}
      </li>
    ))}
  </ul>
);

export interface ExpItem {
  title: string;
  sub?: string | null;
  period?: string | null;
  desc?: string | null;
}

export const ExpList = ({ items }: { items: ExpItem[] }) => (
  <ul className="-my-1">
    {items.map((it, i) => (
      <li key={i} className={`flex gap-4 py-4 ${i ? "border-border-light border-t" : ""}`}>
        <OrgTile name={it.sub || it.title} />
        <div className="min-w-0">
          <h3 className="text-body text-text-primary font-semibold">{it.title}</h3>
          {it.sub && <p className="text-body text-text-primary">{it.sub}</p>}
          {it.period && <p className="text-small text-text-secondary mt-0.5">{it.period}</p>}
          {it.desc && <p className="text-body text-text-secondary mt-2 leading-relaxed">{it.desc}</p>}
        </div>
      </li>
    ))}
  </ul>
);

export const AboutText = ({ pitch, bio }: { pitch?: string | null; bio?: string | null }) => (
  <>
    {pitch && <p className="text-large text-text-primary leading-snug font-semibold tracking-tight">{pitch}</p>}
    {bio && <p className={`text-body text-text-secondary leading-relaxed whitespace-pre-line ${pitch ? "mt-4" : ""}`}>{bio}</p>}
  </>
);

export interface ServiceItem {
  key: string | number;
  name: string;
  desc?: string | null;
  duration: string;
  /** "Free", "₹500", "Paid (coming soon)". */
  price: string;
  free: boolean;
  /** Owner view: "Mon, Wed · 10:00-12:00". */
  when?: string;
  /** Visitor view: "Next: Sat, 10 Oct · 9:00 am". */
  next?: string | null;
  href: string;
  cta: "Book" | "Edit" | "Sign in" | "Continue";
}

/** Each service is one big link: hover lifts it and nudges the arrow, so it clearly reads as clickable. */
export const ServiceList = ({ items }: { items: ServiceItem[] }) => (
  <ul className="space-y-3">
    {items.map((s) => (
      <li key={s.key}>
        <Link
          href={s.href}
          aria-label={`${s.cta} ${s.name}`}
          className="group bg-surface-light hover:ring-primary/40 ring-primary/15 focus-visible:ring-primary flex w-full flex-wrap items-start gap-x-4 gap-y-3 rounded-md p-5 text-left shadow-xs ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="bg-primary-light text-primary group-hover:bg-primary grid size-11 shrink-0 place-items-center rounded-sm transition-colors group-hover:text-white">
            <Video className="size-5" aria-hidden="true" />
          </span>
          <span className="block min-w-0 flex-1 basis-56">
            <span className="text-body text-text-primary block font-semibold">{s.name}</span>
            {s.desc && <span className="text-small text-text-secondary mt-0.5 block leading-relaxed">{s.desc}</span>}
            <span className="text-small text-text-secondary mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />
                {s.duration}
              </span>
              {s.when && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  {s.when}
                </span>
              )}
            </span>
            {s.next && <span className="text-small text-success mt-1.5 block font-medium">{s.next}</span>}
          </span>
          <span className="flex shrink-0 flex-col items-end gap-2.5">
            <span className={`text-large font-extrabold tracking-tight ${s.free ? "text-success" : "text-text-primary"}`}>{s.price}</span>
            <span className="bg-primary group-hover:bg-primary-hover text-small inline-flex items-center gap-1.5 rounded-sm px-4 py-2 font-bold text-white transition-colors">
              {s.cta}
              {s.cta === "Edit" ? <Pencil className="size-3.5" aria-hidden="true" /> : <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
            </span>
          </span>
        </Link>
      </li>
    ))}
  </ul>
);

export const AvailabilityPill = ({ children }: { children: ReactNode }) => (
  <span className="bg-success-light text-success text-small inline-flex items-center gap-2 rounded-sm px-2.5 py-1 font-semibold">
    <span className="bg-success size-2 rounded-full" aria-hidden="true" />
    {children}
  </span>
);

export const OpenToPill = ({ children }: { children: ReactNode }) => (
  <span className="bg-primary-light text-primary text-small inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-semibold">
    <Sparkles className="size-3.5" aria-hidden="true" />
    {children}
  </span>
);

export interface IntroProps {
  name: string;
  headline?: string | null;
  location?: string | null;
  photoUrl?: string | null;
  roleLabel: string;
  /** "Next available · Sat, 10 Oct · 9:00 am" when bookable, else null. */
  availability?: string | null;
  /** "Service provider", "Community member". */
  engagement?: string | null;
  /** Current organisation and school, shown at the right of the intro. */
  orgs: string[];
  /** Pencil to the editor, for the owner. */
  editHref?: string;
  /** Average and count of ratings; nothing is shown when there are none. */
  rating?: { average: number; count: number } | null;
  actions: ReactNode;
}

/** The photo-forward intro card: tinted cover, round portrait, name with the verified tick, meta line, status pills, actions. */
export function Intro({ name, headline, location, photoUrl, roleLabel, availability, engagement, orgs, editHref, rating, actions }: IntroProps) {
  return (
    <ProfileCard>
      <Cover name={name} className="h-28 rounded-t-md" />
      <div className="px-6 pb-7 sm:px-8">
        <div className="flex items-start justify-between">
          <div className="relative z-10 -mt-14 shrink-0">
            <Avatar alt={name} src={photoUrl ?? undefined} sizeClassName="size-28" fillClassName="ring-4 ring-surface-light shadow-sm" />
          </div>
          {editHref && (
            <Link href={editHref} aria-label="Edit intro" className="text-text-secondary hover:bg-bg-light focus-visible:ring-primary mt-3 -mr-2 grid size-9 place-items-center rounded-sm transition-colors focus-visible:ring-2 focus-visible:outline-none">
              <Pencil className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="min-w-0">
            <h1 className="text-display text-text-primary flex flex-wrap items-center gap-2 leading-tight font-bold tracking-tight">
              {name}
              <BadgeCheck className="text-primary size-6" aria-label="Email verified" />
            </h1>
            {headline && <p className="text-large text-text-secondary mt-1">{headline}</p>}
            {rating && (
              <p className="text-body text-text-primary mt-1 flex items-center gap-1.5 font-semibold" aria-label={`Rated ${rating.average} out of 5 from ${rating.count} rating${rating.count > 1 ? "s" : ""}`}>
                <Star className="text-warning size-4 fill-current" aria-hidden />
                {rating.average.toFixed(1)}
                <span className="text-text-secondary font-normal">({rating.count} rating{rating.count > 1 ? "s" : ""})</span>
              </p>
            )}
            <p className="text-small text-text-secondary mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="text-primary size-3.5" aria-hidden="true" />
                Email verified
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="text-success size-3.5" aria-hidden="true" />
                {roleLabel}
              </span>
            </p>
            {(availability || engagement) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {availability && <AvailabilityPill>{availability}</AvailabilityPill>}
                {engagement && <OpenToPill>{engagement}</OpenToPill>}
              </div>
            )}
          </div>
          {orgs.length > 0 && (
            <ul className="space-y-3 md:pt-1">
              {orgs.map((n) => (
                <li key={n} className="flex items-center gap-3">
                  <OrgTile name={n} className="size-10" />
                  <span className="text-small text-text-primary font-semibold">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2.5">{actions}</div>
      </div>
    </ProfileCard>
  );
}

export const RailCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <ProfileCard>
    <div className="p-5 sm:p-6">
      <h2 className="text-body text-text-primary mb-3.5 font-bold tracking-tight">{title}</h2>
      {children}
    </div>
  </ProfileCard>
);

/** The sticky booking card: price, next slot, the services, one clear call to action. */
export function BookCard({
  price,
  free,
  next,
  rows,
  cta,
  note,
}: {
  price: string;
  free: boolean;
  next?: string | null;
  rows: { key: string | number; name: string; detail: string; price: string; href: string }[];
  cta: ReactNode;
  note: ReactNode;
}) {
  return (
    <ProfileCard>
      <div className="p-5 sm:p-6">
        <p className="text-small text-text-secondary font-medium">{free ? "Sessions" : "Sessions from"}</p>
        <p className={`text-display font-extrabold tracking-tight ${free ? "text-success" : "text-text-primary"}`}>
          {price}
          {!free && <span className="text-small text-text-secondary ml-1 font-medium">/ session</span>}
        </p>
        {next && (
          <p className="text-small text-success mt-2 flex items-center gap-2 font-semibold">
            <span className="bg-success size-2 rounded-full" aria-hidden="true" />
            Next available · {next}
          </p>
        )}
        {rows.length > 0 && (
          <ul className="border-border-light divide-border-light mt-4 divide-y border-y">
            {rows.map((r) => (
              <li key={r.key}>
                <Link href={r.href} className="group hover:bg-primary-light focus-visible:ring-primary -mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-md px-2 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none">
                  <span className="min-w-0">
                    <span className="text-small text-text-primary block truncate font-semibold">{r.name}</span>
                    <span className="text-small text-text-secondary">{r.detail}</span>
                  </span>
                  <span className="text-small text-text-primary flex shrink-0 items-center gap-1 font-bold">
                    {r.price}
                    <ChevronRight className="text-text-secondary size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-5">{cta}</div>
        <p className="text-small text-text-secondary mt-3 flex items-start gap-2">
          <ShieldCheck className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{note}</span>
        </p>
      </div>
    </ProfileCard>
  );
}
