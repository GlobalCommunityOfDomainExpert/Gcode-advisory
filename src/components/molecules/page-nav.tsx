import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Icon } from "@/components/atoms";

/** How many cards a list page holds before it pages (directory, My bookings). */
export const PAGE_SIZE = 25;

/** The page number in an address ("?page=3"): a whole number from 1, anything else is page 1. */
export function pageFrom(raw: string | undefined): number {
  const n = /^\d{1,4}$/.test(raw ?? "") ? Number(raw) : 1;
  return Math.max(1, n);
}

/** Where a page starts, for the backend's page_skip. */
export const skipFor = (page: number) => (page - 1) * PAGE_SIZE;

const linkClass =
  "text-small text-primary focus-visible:ring-primary inline-flex items-center gap-1 rounded-sm px-2 py-1.5 font-semibold hover:bg-primary-light focus-visible:ring-2 focus-visible:outline-none";

/**
 * Previous / Page N / Next for a list the backend pages without counting (it only says whether a next page exists), so the buttons are
 * real links: the page is in the address, so it can be bookmarked, shared and used with the browser's back button. Renders nothing
 * when everything fits on one page.
 */
export function PageNav({ page, hasMore, href, label = "More results" }: { page: number; hasMore: boolean; href: (page: number) => string; label?: string }) {
  if (page <= 1 && !hasMore) return null;
  return (
    <nav aria-label={label} className="flex items-center justify-between gap-3 pb-8">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={linkClass}>
          <Icon icon={ChevronLeft} size="sm" /> Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-small text-text-secondary" aria-current="page">
        Page {page}
      </span>
      {hasMore ? (
        <Link href={href(page + 1)} rel="next" className={linkClass}>
          Next <Icon icon={ChevronRight} size="sm" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
