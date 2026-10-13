/** How many cards a list page holds before it pages (directory, My bookings). */
export const PAGE_SIZE = 25;

/** The page number in an address ("?page=3"): a whole number from 1, anything else is page 1. */
export function pageFrom(raw: string | undefined): number {
  const n = /^\d{1,4}$/.test(raw ?? "") ? Number(raw) : 1;
  return Math.max(1, n);
}

/** Where a page starts, for the backend's page_skip. */
export const skipFor = (page: number) => (page - 1) * PAGE_SIZE;

/** How many pages a list of `total` cards makes (at least one). */
export const pageCount = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE));

/** The address of every page, 1 to the last: the numbered pager is a client component, so it is given addresses, not a function. */
export const pageHrefs = (total: number, href: (page: number) => string): string[] => Array.from({ length: pageCount(total) }, (_, i) => href(i + 1));
