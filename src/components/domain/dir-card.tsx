import { ReactNode } from "react";
import { BadgeCheck, Bookmark, MapPin, Star } from "lucide-react";
import { Avatar, Button, Icon, Skeleton } from "@/components/atoms";
import { initials as getInitials } from "@/lib/initials";
import { focusRing } from "@/lib/ui";

export type DirType = "experts" | "interns" | "startups" | "institutes";

/** Label pinned bottom-left of the photo area. */
export interface DirCardBadge {
  text: string;
  tone?: "primary" | "success";
  /** A small green dot before the text (e.g. "Hiring"). */
  dot?: boolean;
}

/** The status line under the pitch. */
export interface DirCardCue {
  text: string;
  tone: "success" | "muted";
  dot?: boolean;
}

/** The footer's left side: a price, a status pill, or a single fact. */
export type DirCardFooter =
  | { kind: "price"; label: string; value: string; suffix?: string; free?: boolean }
  | { kind: "status"; text: string; tone: "warning" | "neutral" }
  | { kind: "fact"; label: string; value: string };

export interface DirCardProps {
  name: string;
  /** One line under the name. */
  headline: string;
  initials?: string;
  photoSrc?: string;
  /** Pill pinned top-left of the photo area. */
  certified?: boolean;
  badge: DirCardBadge;
  rating?: number;
  reviewCount?: number;
  location: string;
  /** Text after the location, e.g. "Senior" or "Seed · 12 people". */
  meta?: string;
  tags: string[];
  moreTags?: number;
  pitch: string;
  cue?: DirCardCue;
  footer: DirCardFooter;
  saved?: boolean;
  /** `Book` for bookable experts, `Connect` for everyone else, none for not-bookable experts. */
  primaryAction?: "book" | "connect";
  onOpen?: () => void;
  onBookmark?: () => void;
  onPrimary?: () => void;
}

// Red is reserved for errors / CTAs, so photo tints use navy, green, amber and neutral only.
const TONES = [
  "bg-primary-light text-primary",
  "bg-success-light text-success",
  "bg-warning-light text-warning",
  "bg-bg-light text-text-secondary",
];
const toneFor = (name: string) => TONES[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];

function Pill({ children, className = "bg-primary text-white" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`${className} text-small inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-medium`}>
      {children}
    </span>
  );
}

/**
 * Photo-forward marketplace card, one design for every stakeholder type. "Book" appears only on experts who are
 * bookable; everyone else gets an honest status. Soft-elevated (no hard borders) and lifts on hover.
 */
export function DirCard({
  name,
  headline,
  initials,
  photoSrc,
  certified,
  badge,
  rating,
  reviewCount,
  location,
  meta,
  tags,
  moreTags = 0,
  pitch,
  cue,
  footer,
  saved = false,
  primaryAction,
  onOpen,
  onBookmark,
  onPrimary,
}: DirCardProps) {
  return (
    <article className="group bg-surface-light border-border-light relative flex min-w-0 flex-col overflow-hidden rounded-md border shadow-sm transition-all duration-300 hover:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${name}’s profile`}
        className={`${focusRing} ${toneFor(name)} relative block h-44 w-full overflow-hidden text-left`}
      >
        <span aria-hidden="true" className="absolute -top-16 -right-10 size-56 rounded-full bg-white/50" />
        <span aria-hidden="true" className="absolute -bottom-20 -left-10 size-48 rounded-full bg-white/40" />
        <span
          aria-hidden="true"
          className="text-display absolute inset-0 grid place-items-center text-5xl font-extrabold tracking-tight transition-transform duration-500 group-hover:scale-110"
          style={{ fontSize: "3.5rem" }}
        >
          {initials ?? getInitials(name)}
        </span>
        {photoSrc && (
          <span className="absolute inset-0 grid place-items-center transition-transform duration-500 group-hover:scale-105">
            <Avatar
              alt={name}
              src={photoSrc}
              sizeClassName="size-24"
              fillClassName="ring-4 ring-white shadow-lg font-bold"
            />
          </span>
        )}
        <span className="absolute top-3 left-3">
          {certified && (
            <Pill>
              <Icon icon={BadgeCheck} size="sm" className="size-3.5!" />
              Certified
            </Pill>
          )}
        </span>
        <span className="absolute bottom-3 left-3">
          <Pill className={badge.tone === "success" ? "bg-success text-white" : "bg-primary text-white"}>
            {badge.dot && <span className="bg-success size-1.5 rounded-full" />}
            {badge.text}
          </Pill>
        </span>
      </button>
      <button
        type="button"
        onClick={onBookmark}
        aria-pressed={saved}
        aria-label={`${saved ? "Remove bookmark" : "Bookmark"} ${name}`}
        className={`${focusRing} bg-surface-light absolute top-3 right-3 grid size-9 place-items-center rounded-full shadow-sm transition-colors ${
          saved ? "text-secondary" : "text-text-secondary hover:text-text-primary"
        }`}
      >
        <Icon icon={Bookmark} size="sm" className={saved ? "fill-current" : ""} />
      </button>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-large text-text-primary leading-snug font-bold">{name}</h3>
            {rating !== undefined && reviewCount ? (
              <span className="text-small text-text-primary inline-flex shrink-0 items-center gap-1 font-semibold">
                <Icon icon={Star} size="sm" className="text-warning size-3.5! fill-current" />
                {rating.toFixed(1)}
                <span className="text-text-secondary font-normal">({reviewCount})</span>
              </span>
            ) : null}
          </div>
          <p className="text-small text-text-secondary truncate">{headline}</p>
          <p className="text-small text-text-secondary mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="inline-flex items-center gap-1.5">
              <Icon icon={MapPin} size="sm" className="size-3.5!" />
              {location}
            </span>
            {meta && <span>· {meta}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span key={t} className="bg-bg-light text-text-secondary text-small rounded-sm px-2 py-0.5 font-medium">
              {t}
            </span>
          ))}
          {moreTags > 0 && <span className="text-small text-text-secondary px-1">+{moreTags}</span>}
        </div>
        <p className="text-small text-text-secondary line-clamp-2">{pitch}</p>
        {cue &&
          (cue.tone === "success" ? (
            <p className="text-small text-success flex items-center gap-2 font-medium">
              <span className="bg-success size-1.5 rounded-full" />
              {cue.text}
            </p>
          ) : (
            <p className="text-small text-text-secondary">{cue.text}</p>
          ))}
        <div className="border-border-light mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <Footer footer={footer} />
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onOpen}>
              View
            </Button>
            {primaryAction && (
              <Button size="sm" onClick={onPrimary}>
                {primaryAction === "book" ? "Book" : "Connect"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function Footer({ footer }: { footer: DirCardFooter }) {
  if (footer.kind === "price")
    return (
      <div className="min-w-0">
        <p className="text-small text-text-secondary leading-none">{footer.label}</p>
        <p className={`text-large ${footer.free ? "text-success" : "text-text-primary"} font-extrabold`}>
          {footer.value}
          {footer.suffix && <span className="text-small text-text-secondary font-normal">{footer.suffix}</span>}
        </p>
      </div>
    );
  if (footer.kind === "status")
    return (
      <span
        className={`${
          footer.tone === "warning" ? "bg-warning-light text-warning" : "bg-bg-light text-text-secondary"
        } text-small rounded-full px-2.5 py-1 font-medium`}
      >
        {footer.text}
      </span>
    );
  return (
    <div className="min-w-0">
      <p className="text-small text-text-secondary leading-none">{footer.label}</p>
      <p className="text-body text-text-primary font-semibold">{footer.value}</p>
    </div>
  );
}

/** Loading placeholder shaped like `DirCard`. */
export function DirCardSkeleton() {
  return (
    <div className="bg-surface-light border-border-light overflow-hidden rounded-md border shadow-sm" aria-hidden="true">
      <Skeleton className="h-44" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-2/3 rounded-sm" />
        <Skeleton className="h-4 w-1/2 rounded-sm" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full rounded-sm" />
        <div className="flex items-center justify-between pt-3">
          <Skeleton className="h-6 w-24 rounded-sm" />
          <Skeleton className="h-9 w-28 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
