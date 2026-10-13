import type { DirectorySort } from "./types";

export interface DirectoryQuery {
  term: string;
  domain: string;
  location: string;
  /** A kind of session ("Career mentoring & guidance"), exactly as the filter menu lists it. */
  service: string;
  /** Whole rupees as text; empty = no limit. "0" and "0" together mean free sessions. */
  priceMin: string;
  priceMax: string;
  bookable: boolean;
  sort: DirectorySort;
}

/** The address of a directory view. Everything is in the URL, so a filtered list can be shared and survives a refresh; a change goes back to page 1. */
export function directoryHref(q: DirectoryQuery, page = 1): string {
  const p = new URLSearchParams();
  if (q.term) p.set("term", q.term);
  if (q.domain) p.set("domain", q.domain);
  if (q.location) p.set("location", q.location);
  if (q.service) p.set("service", q.service);
  if (q.priceMin) p.set("price_min", q.priceMin);
  if (q.priceMax) p.set("price_max", q.priceMax);
  if (q.bookable) p.set("bookable", "1");
  if (q.sort !== "relevance") p.set("sort", q.sort);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `/directory?${s}` : "/directory";
}
