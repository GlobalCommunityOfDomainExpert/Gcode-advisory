"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, ChevronDown, X } from "lucide-react";
import { Icon } from "@/components/atoms";
import { SearchBar } from "@/components/molecules";
import type { DirectoryFilters, DirectorySort } from "@/lib/booking/types";

export interface DirectoryQuery {
  term: string;
  domain: string;
  location: string;
  bookable: boolean;
  sort: DirectorySort;
}

const SORTS: [DirectorySort, string][] = [
  ["relevance", "Relevance"],
  ["rating", "Highest rated"],
  ["price", "Price: low to high"],
];

/** The address of a directory view. Everything is in the URL, so a filtered list can be shared and survives a refresh; a change goes back to page 1. */
export function directoryHref(q: DirectoryQuery, page = 1): string {
  const p = new URLSearchParams();
  if (q.term) p.set("term", q.term);
  if (q.domain) p.set("domain", q.domain);
  if (q.location) p.set("location", q.location);
  if (q.bookable) p.set("bookable", "1");
  if (q.sort !== "relevance") p.set("sort", q.sort);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `/directory?${s}` : "/directory";
}

const chip = "text-small inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition-colors";
const chipOn = "border-secondary bg-secondary text-white";
const chipOff = "border-border-light bg-surface-light text-text-primary hover:bg-bg-light";

/** A filter chip with a real <select> laid over it: accessible, and the phone's own picker opens. */
function PillSelect({ label, value, options, allLabel, onChange }: { label: string; value: string; options: { value: string; label: string; short?: string }[]; allLabel: string; onChange: (v: string) => void }) {
  const found = options.find((o) => o.value === value);
  const shown = found?.short ?? found?.label ?? value;
  return (
    <label className="focus-within:ring-primary relative inline-flex rounded-full focus-within:ring-2 focus-within:ring-offset-2">
      <span className={`pointer-events-none ${chip} ${value ? chipOn : chipOff}`}>
        {value ? (
          <>
            {label}:<span className="font-semibold">{shown}</span>
          </>
        ) : (
          label
        )}
        <Icon icon={ChevronDown} size="sm" className="size-4!" />
      </span>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * The wireframe's filter card (search and filter chips) and sticky results toolbar (count, applied filters, Bookable now, sort), without
 * its tabs: only experts are listed for now. Every control just changes the address; the page itself is rendered by the server.
 */
export function DirectoryControls({ query, filters, total, bookable }: { query: DirectoryQuery; filters: DirectoryFilters; total: number; bookable: number }) {
  const router = useRouter();
  const [term, setTerm] = useState(query.term);
  const go = (next: Partial<DirectoryQuery>) => router.push(directoryHref({ ...query, ...next }), { scroll: false });

  const applied: { key: string; label: string; clear: Partial<DirectoryQuery> }[] = [];
  if (query.domain) applied.push({ key: "domain", label: query.domain, clear: { domain: "" } });
  if (query.location) applied.push({ key: "location", label: query.location, clear: { location: "" } });
  const anyFilter = applied.length > 0 || query.bookable || !!query.term;

  return (
    <>
      <div className="border-border-light bg-surface-light space-y-4 rounded-md border p-4 shadow-sm">
        <SearchBar
          className="max-w-none"
          value={term}
          onChange={setTerm}
          onSubmit={(v) => go({ term: v.trim().slice(0, 40) })}
          placeholder="Search experts by name, skill or topic"
        />
        <div className="flex flex-wrap gap-2">
          <PillSelect label="Expertise" value={query.domain} allLabel="All expertise" options={filters.expertise.map((o) => ({ value: o.value, label: `${o.value} (${o.count})`, short: o.value }))} onChange={(v) => go({ domain: v })} />
          <PillSelect label="Location" value={query.location} allLabel="All locations" options={filters.locations.map((o) => ({ value: o.value, label: `${o.value} (${o.count})`, short: o.value }))} onChange={(v) => go({ location: v })} />
        </div>
      </div>

      <div className="bg-page/95 sticky top-0 z-20 -mx-4 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p role="status" className="text-body text-text-primary mr-1 font-semibold">
              {total} {total === 1 ? "expert" : "experts"}
              {!query.bookable && ` · ${bookable} bookable now`}
            </p>
            {applied.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => go(a.clear)}
                aria-label={`Remove filter ${a.label}`}
                className="border-border-light bg-surface-light text-text-primary text-small hover:bg-bg-light focus-visible:ring-primary inline-flex items-center gap-1.5 rounded-full border py-1 pr-2 pl-3 font-medium focus-visible:ring-2 focus-visible:outline-none"
              >
                {a.label}
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ))}
            {anyFilter && (
              <button
                type="button"
                onClick={() => {
                  setTerm("");
                  router.push("/directory", { scroll: false });
                }}
                className="text-small text-text-secondary hover:text-text-primary focus-visible:ring-primary rounded-sm font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={query.bookable}
              onClick={() => go({ bookable: !query.bookable })}
              className={`focus-visible:ring-primary ${chip} focus-visible:ring-2 focus-visible:outline-none ${query.bookable ? chipOn : chipOff}`}
            >
              <CalendarCheck className="size-4" aria-hidden="true" /> Bookable now
            </button>
            <PillSelect
              label="Sort"
              value={query.sort === "relevance" ? "" : query.sort}
              allLabel="Relevance"
              options={SORTS.filter(([v]) => v !== "relevance").map(([value, label]) => ({ value, label }))}
              onChange={(v) => go({ sort: (v || "relevance") as DirectorySort })}
            />
          </div>
        </div>
      </div>
    </>
  );
}
