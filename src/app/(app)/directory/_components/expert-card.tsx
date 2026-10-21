import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarClock, MapPin, Star } from "lucide-react";
import { Avatar, ButtonLink, Icon } from "@/components/atoms";
import { Cover } from "@/components/profile-view/cover";
import type { ExpertCard } from "@/lib/booking/types";
import { fmtDay, fmtTime, rupees } from "@/lib/booking/time";
import { cn } from "@/lib/cn";

/**
 * One expert in the directory. "Book" appears only on experts who can be booked. Everyone else gets an honest status
 * and no button. Stars show once an expert has at least one rating. Bookmarks and reviews come in later sprints.
 */
export function ExpertCardView({
  expert,
  paymentsEnabled,
  footer,
  nextLabel = "Next",
  highlight,
  selected,
  newTab,
}: {
  expert: ExpertCard;
  paymentsEnabled: boolean;
  /** Replaces the price and Book row (the rescue flow shows "same price" and the time picker there). Put anything clickable in `relative z-10`. */
  footer?: ReactNode;
  /** Word before the time line: "Next" in the directory, "Suggested" when we are offering a time. */
  nextLabel?: string;
  /** Tags to show first and tint (what this expert shares with someone else). */
  highlight?: string[];
  selected?: boolean;
  /** Open the profile in a new tab, so a dialog or page the person is in stays put. */
  newTab?: boolean;
}) {
  // While payments are off every bookable service is free, whatever the expert chose on their profile.
  const freeOnly = !paymentsEnabled;
  const hasFreeOption = paymentsEnabled && expert.fromPriceMinor === 0;
  const marked = new Set(highlight ?? []);
  const tags = marked.size
    ? [...expert.skills, ...expert.domains].filter((t, i, a) => a.indexOf(t) === i).sort((a, b) => Number(marked.has(b)) - Number(marked.has(a)))
    : expert.skills.length
      ? expert.skills
      : expert.domains;
  const next = expert.nextSlotAt ?? null;

  return (
    <article
      className={cn(
        "bg-surface-light relative flex min-w-0 flex-col overflow-hidden rounded-md border shadow-sm transition-shadow duration-300 hover:shadow-md",
        selected ? "border-primary ring-primary shadow-md ring-1" : "border-border-light",
      )}
    >
      <Cover name={expert.name} className="grid h-44 place-items-center">
        <Avatar src={expert.photoUrl ?? undefined} alt={expert.name} sizeClassName="size-24" fillClassName="ring-4 ring-white shadow-lg" />
        {expert.bookable && !footer && (
          <span className={`${freeOnly ? "bg-success" : "bg-primary"} text-small absolute bottom-3 left-3 rounded-sm px-2 py-0.5 font-medium text-white`}>
            {freeOnly ? "Free sessions" : "Paid sessions"}
          </span>
        )}
      </Cover>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-large text-text-primary leading-snug font-bold">
            <Link href={`/experts/${expert.slug}`} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="hover:underline focus-visible:underline after:absolute after:inset-0 after:content-['']">
              {expert.name}
            </Link>
          </h3>
          {expert.headline && <p className="text-small text-text-secondary truncate">{expert.headline}</p>}
          {expert.rating && (
            <p className="text-small text-text-primary mt-1 flex items-center gap-1.5 font-semibold" aria-label={`Rated ${expert.rating.average} out of 5 from ${expert.rating.count} rating${expert.rating.count > 1 ? "s" : ""}`}>
              <Icon icon={Star} size="sm" className="text-warning size-3.5! fill-current" />
              {expert.rating.average.toFixed(1)}
              <span className="text-text-secondary font-normal">({expert.rating.count})</span>
            </p>
          )}
          {expert.location && (
            <p className="text-small text-text-secondary mt-1 flex items-center gap-1.5">
              <Icon icon={MapPin} size="sm" className="size-3.5!" />
              {expert.location}
            </p>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className={cn("text-small rounded-sm px-2 py-0.5 font-medium", marked.has(t) ? "bg-success-light text-success" : "bg-bg-light text-text-secondary")}>
                {t}
              </span>
            ))}
            {tags.length > 3 && <span className="text-small text-text-secondary px-1">+{tags.length - 3}</span>}
          </div>
        )}

        {expert.bio && <p className="text-small text-text-secondary line-clamp-2">{expert.bio}</p>}

        {expert.bookable ? (
          <p className="text-small text-success flex items-center gap-2 font-medium">
            <Icon icon={CalendarClock} size="sm" className="size-3.5!" />
            {next ? `${nextLabel}: ${fmtDay(next)} · ${fmtTime(next)}` : "No open times in the next two weeks"}
          </p>
        ) : (
          <p className="text-small text-text-secondary">
            {expert.status === "COMMUNITY" ? "Not offering sessions" : expert.status === "PAID_SOON" ? "Offers paid sessions, which open soon" : "Hasn’t set up availability yet"}
          </p>
        )}

        {footer ? (
          <div className="border-border-light relative z-10 mt-auto border-t pt-4">{footer}</div>
        ) : (
        <div className="border-border-light mt-auto flex items-center justify-between gap-3 border-t pt-4">
          {expert.bookable ? (
            <>
              <div className="min-w-0">
                <p className="text-small text-text-secondary leading-none">{freeOnly ? "Sessions" : hasFreeOption ? "Includes" : "From"}</p>
                {hasFreeOption ? (
                  <p className="text-body text-success font-bold">A free session</p>
                ) : (
                  <p className={`text-large ${freeOnly ? "text-success" : "text-text-primary"} font-extrabold`}>
                    {freeOnly ? "FREE" : rupees(expert.fromPriceMinor ?? 0)}
                    {!freeOnly && <span className="text-small text-text-secondary font-normal"> / session</span>}
                  </p>
                )}
              </div>
              <ButtonLink href={`/book/${expert.userId}`} size="sm" className="relative z-10" aria-label={`Book a session with ${expert.name}`}>
                Book
              </ButtonLink>
            </>
          ) : (
            <span
              className={`${expert.status === "COMMUNITY" ? "bg-bg-light text-text-secondary" : "bg-warning-light text-warning"} text-small rounded-full px-2.5 py-1 font-medium`}
            >
              {expert.status === "COMMUNITY" ? "Community member" : expert.status === "PAID_SOON" ? "Paid sessions coming soon" : "Not bookable yet"}
            </span>
          )}
        </div>
        )}
      </div>
    </article>
  );
}
