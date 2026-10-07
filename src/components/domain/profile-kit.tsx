import { ReactNode } from "react";
import { ArrowRight, CalendarDays, Clock, Link as LinkIcon, Pencil, Plus, Sparkles, Star, Video } from "lucide-react";
import { Avatar, Button, Icon } from "@/components/atoms";
import { initials } from "@/lib/initials";
import { focusRing } from "@/lib/ui";

/*
 * Building blocks shared by the profile view / preview and the directory person page.
 * Production look: soft ringed cards (no hard borders), logo monograms, service rows, review cards.
 */

export function ProfileCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`bg-surface-light min-w-0 rounded-md border shadow-xs ${className}`}>{children}</section>;
}

function SectionHead({ title, sub, onEdit }: { title: string; sub?: string; onEdit?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-large text-text-primary font-bold tracking-tight">{title}</h2>
        {sub && <p className="text-small text-text-secondary mt-0.5">{sub}</p>}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${title}`}
          className={`text-text-secondary hover:bg-bg-light hover:text-text-primary ${focusRing} -mt-1.5 -mr-2 grid size-9 shrink-0 place-items-center rounded-sm transition-colors`}
        >
          <Icon icon={Pencil} size="sm" />
        </button>
      )}
    </div>
  );
}

export function AddPrompt({ text, onAdd }: { text: string; onAdd?: () => void }) {
  return (
    <div className="border-border-hover bg-bg-subtle flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed p-4">
      <p className="text-small text-text-secondary">{text}</p>
      <Button variant="outline" size="sm" onClick={onAdd}>
        <Icon icon={Plus} size="sm" /> Add
      </Button>
    </div>
  );
}

export interface ProfileSectionProps {
  title: string;
  /** Whether the section has content. Without it, owners see an "Add" prompt and visitors see nothing. */
  hasContent: boolean;
  /** Owners get an edit pencil and the add prompt. */
  owner?: boolean;
  /** Small line under the title, e.g. who can see it. */
  sub?: string;
  /** Prompt shown to the owner when the section is empty. */
  prompt?: string;
  onEdit?: () => void;
  onAdd?: () => void;
  children?: ReactNode;
}

/** A section card: shown when it has content; otherwise an "Add" prompt for the owner and nothing for visitors. */
export function ProfileSection({
  title,
  hasContent,
  owner = false,
  sub,
  prompt = "",
  onEdit,
  onAdd,
  children,
}: ProfileSectionProps) {
  if (hasContent)
    return (
      <ProfileCard>
        <div className="p-6 sm:p-7">
          <SectionHead title={title} sub={sub} onEdit={owner ? onEdit : undefined} />
          <div className="mt-5">{children}</div>
        </div>
      </ProfileCard>
    );
  if (!owner) return null;
  return (
    <ProfileCard>
      <div className="p-6 sm:p-7">
        <SectionHead title={title} />
        <div className="mt-5">
          <AddPrompt text={prompt} onAdd={onAdd} />
        </div>
      </div>
    </ProfileCard>
  );
}

/** Photo (people) or monogram "logo" (organisations). */
export function OrgTile({ name, sizeClassName = "size-12" }: { name: string; sizeClassName?: string }) {
  return (
    <span
      className={`${sizeClassName} text-small bg-primary-light text-primary ring-primary/10 grid shrink-0 place-items-center rounded-sm font-bold ring-1`}
    >
      {initials(name)}
    </span>
  );
}

export function FactGrid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-small text-text-secondary">{k}</dt>
          <dd className="text-body text-text-primary mt-0.5 font-semibold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SkillChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s) => (
        <span
          key={s}
          className="border-border-light bg-bg-subtle text-text-primary text-small rounded-sm border px-3 py-1.5 font-medium"
        >
          {s}
        </span>
      ))}
    </div>
  );
}

export function AvailabilityPill({ children }: { children: ReactNode }) {
  return (
    <span className="bg-success-light text-success text-small inline-flex items-center gap-2 rounded-sm px-2.5 py-1 font-semibold">
      <span className="bg-success size-2 rounded-full" />
      {children}
    </span>
  );
}

export function OpenToPill({ children }: { children: string }) {
  return (
    <span className="bg-primary-light text-primary text-small inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-semibold">
      <Icon icon={Sparkles} size="sm" className="size-3.5!" />
      {children}
    </span>
  );
}

/** Rating · sessions · price strip inside the profile intro card. */
export function ProfileStats({ cells }: { cells: [ReactNode, string][] }) {
  return (
    <dl
      className="border-border-light divide-border-light mt-6 grid divide-x border-t pt-5"
      style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
    >
      {cells.map(([v, l], i) => (
        <div key={l} className={`${i ? "pl-4 sm:pl-6" : "pr-4 sm:pr-6"} min-w-0`}>
          <dd className="text-large text-text-primary leading-snug font-extrabold tracking-tight">{v}</dd>
          <dt className="text-small text-text-secondary">{l}</dt>
        </div>
      ))}
    </dl>
  );
}

export interface ExperienceItem {
  title: string;
  sub?: string;
  period?: string;
  desc?: string;
}

export function ExperienceList({ items }: { items: ExperienceItem[] }) {
  return (
    <ul className="-my-1">
      {items.map((it, i) => (
        <li key={`${it.title}-${i}`} className={`flex gap-4 py-4 ${i ? "border-border-light border-t" : ""}`}>
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
}

export interface ServiceRowItem {
  name: string;
  desc?: string;
  duration: string;
  price: string;
  free?: boolean;
  /** e.g. "Weekdays" */
  when: string;
  next?: string;
  /** `Book` (visitors) or `Edit` (owner). */
  cta?: "Book" | "Edit";
  onClick?: () => void;
}

/** Service cards: the WHOLE card is one button, so it clearly reads as clickable (hover lifts it and shifts the arrow). */
export function ServiceRows({ items }: { items: ServiceRowItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li key={s.name}>
          <button
            type="button"
            onClick={s.onClick}
            className={`group ${focusRing} bg-surface-light hover:ring-primary/40 ring-primary/15 flex w-full cursor-pointer flex-wrap items-start gap-x-4 gap-y-3 rounded-md p-5 text-left shadow-xs ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
          >
            <span className="bg-primary-light text-primary group-hover:bg-primary grid size-11 shrink-0 place-items-center rounded-sm transition-colors group-hover:text-white">
              <Icon icon={Video} size="md" />
            </span>
            <span className="block min-w-0 flex-1 basis-56">
              <span className="text-body text-text-primary block font-semibold">{s.name}</span>
              {s.desc && <span className="text-small text-text-secondary mt-0.5 block leading-relaxed">{s.desc}</span>}
              <span className="text-small text-text-secondary mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon={Clock} size="sm" />
                  {s.duration}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon={CalendarDays} size="sm" />
                  {s.when}
                </span>
              </span>
              {s.next && <span className="text-small text-success mt-1.5 block font-medium">{s.next}</span>}
            </span>
            <span className="flex shrink-0 flex-col items-end gap-2.5">
              <span className={`text-large ${s.free ? "text-success" : "text-text-primary"} font-extrabold tracking-tight`}>
                {s.price}
              </span>
              <span className="bg-primary group-hover:bg-primary-hover text-small inline-flex items-center gap-1.5 rounded-sm px-4 py-2 font-bold text-white transition-colors">
                {s.cta || "Book"}
                <Icon
                  icon={s.cta === "Edit" ? Pencil : ArrowRight}
                  size="sm"
                  className="size-3.5! transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ProjectCard({ title, desc, link }: { title: string; desc?: string; link?: string }) {
  return (
    <div className="bg-bg-subtle rounded-md border p-5">
      <h3 className="text-body text-text-primary font-semibold">{title}</h3>
      {desc && <p className="text-small text-text-secondary mt-1 leading-relaxed">{desc}</p>}
      {link && (
        <p className="text-small text-primary mt-3 flex items-center gap-1.5 font-medium">
          <Icon icon={LinkIcon} size="sm" />
          {link}
        </p>
      )}
    </div>
  );
}

export interface Review {
  name: string;
  role: string;
  text: string;
  avatarSrc?: string;
}

function Stars({ n = 5 }: { n?: number }) {
  return (
    <span className="text-warning flex gap-0.5" aria-label={`${n} out of 5`}>
      {Array.from({ length: n }, (_, i) => (
        <Icon key={i} icon={Star} size="sm" className="size-3.5! fill-current" />
      ))}
    </span>
  );
}

export function ReviewCards({ reviews }: { reviews: Review[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {reviews.map((r) => (
        <figure key={r.name} className="bg-bg-subtle flex flex-col gap-4 rounded-md border p-5">
          <Stars />
          <blockquote className="text-body text-text-primary leading-relaxed">“{r.text}”</blockquote>
          <figcaption className="mt-auto flex items-center gap-3">
            <Avatar alt={r.name} src={r.avatarSrc} size="md" />
            <span className="min-w-0">
              <span className="text-small text-text-primary block truncate font-semibold">{r.name}</span>
              <span className="text-small text-text-secondary block truncate">{r.role}</span>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
