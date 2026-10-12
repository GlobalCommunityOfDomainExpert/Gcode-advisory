"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, ChevronDown, X } from "lucide-react";
import { Icon } from "@/components/atoms";
import { SearchBar } from "@/components/molecules";
import type { DirectoryFilters, DirectorySort } from "@/lib/booking/types";

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
  if (q.service) p.set("service", q.service);
  if (q.priceMin) p.set("price_min", q.priceMin);
  if (q.priceMax) p.set("price_max", q.priceMax);
  if (q.bookable) p.set("bookable", "1");
  if (q.sort !== "relevance") p.set("sort", q.sort);
  if (page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `/directory?${s}` : "/directory";
}

const chip = "text-small inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition-colors";
const chipOn = "border-secondary bg-secondary text-white";
const chipOff = "border-border-light bg-surface-light text-text-primary hover:bg-bg-light";


const rupee = (n: string) => `₹${Number(n).toLocaleString("en-IN")}`;

/** "Free", "₹500–₹1,000", "Up to ₹500", "₹1,000+": how a price range reads on the chip and in the applied filters. */
export function priceLabel(min: string, max: string): string {
  if (min === "0" && max === "0") return "Free";
  if (min && max) return `${rupee(min)}–${rupee(max)}`;
  if (max) return `Up to ${rupee(max)}`;
  return `${rupee(min)}+`;
}

const PRESETS: { label: string; min: string; max: string }[] = [
  { label: "Free", min: "0", max: "0" },
  { label: "Under ₹500", min: "", max: "500" },
  { label: "₹500 – ₹1,000", min: "500", max: "1000" },
  { label: "₹1,000+", min: "1000", max: "" },
];

/** The Price chip: it opens a small panel with a few common ranges and a minimum and maximum of your own. */
function PricePicker({ min, max, onApply }: { min: string; max: string; onApply: (min: string, max: string) => void }) {
  const [open, setOpen] = useState(false);
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  const box = useRef<HTMLDivElement>(null);
  const active = !!(min || max);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function toggle() {
    if (!open) {
      setLo(min);
      setHi(max);
    }
    setOpen(!open);
  }

  function apply(a: string, b: string) {
    // a maximum below the minimum is the same range typed the other way round
    const [x, y] = a && b && Number(a) > Number(b) ? [b, a] : [a, b];
    setOpen(false);
    onApply(x, y);
  }

  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 7);

  return (
    <div ref={box} className="relative">
      <button type="button" aria-expanded={open} aria-haspopup="dialog" onClick={toggle} className={`focus-visible:ring-primary ${chip} focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${active ? chipOn : chipOff}`}>
        {active ? (
          <>
            Price:<span className="font-semibold">{priceLabel(min, max)}</span>
          </>
        ) : (
          "Price"
        )}
        <Icon icon={ChevronDown} size="sm" className="size-4!" />
      </button>
      {open && (
        <div role="dialog" aria-label="Price range" className="border-border-light bg-surface-light absolute top-full left-0 z-30 mt-2 w-72 rounded-md border p-4 shadow-lg">
          <p className="text-small text-text-secondary mb-2 font-semibold">Price per session</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const on = p.min === min && p.max === max;
              return (
                <button key={p.label} type="button" onClick={() => apply(p.min, p.max)} className={`focus-visible:ring-primary ${chip} focus-visible:ring-2 focus-visible:outline-none ${on ? chipOn : chipOff}`}>
                  {p.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-small text-text-secondary block">
              Minimum (₹)
              <input inputMode="numeric" value={lo} onChange={(e) => setLo(digits(e.target.value))} placeholder="0" className="border-border-light bg-surface-light text-body text-text-primary focus-visible:ring-primary mt-1 h-10 w-full rounded-sm border px-3 focus-visible:ring-2 focus-visible:outline-none" />
            </label>
            <label className="text-small text-text-secondary block">
              Maximum (₹)
              <input inputMode="numeric" value={hi} onChange={(e) => setHi(digits(e.target.value))} placeholder="Any" className="border-border-light bg-surface-light text-body text-text-primary focus-visible:ring-primary mt-1 h-10 w-full rounded-sm border px-3 focus-visible:ring-2 focus-visible:outline-none" />
            </label>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button type="button" onClick={() => apply("", "")} className="text-small text-text-secondary hover:text-text-primary focus-visible:ring-primary rounded-sm font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none">
              Clear
            </button>
            <button type="button" onClick={() => apply(lo, hi)} className="bg-primary text-small hover:bg-primary-hover focus-visible:ring-primary rounded-sm px-4 py-2 font-bold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  if (query.service) applied.push({ key: "service", label: query.service, clear: { service: "" } });
  if (query.priceMin || query.priceMax) applied.push({ key: "price", label: priceLabel(query.priceMin, query.priceMax), clear: { priceMin: "", priceMax: "" } });
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
          <PillSelect label="Service" value={query.service} allLabel="All services" options={filters.services.map((o) => ({ value: o.value, label: `${o.value} (${o.count})`, short: o.value }))} onChange={(v) => go({ service: v })} />
          {filters.paymentsEnabled && filters.maxPriceMinor > 0 && <PricePicker min={query.priceMin} max={query.priceMax} onApply={(a, b) => go({ priceMin: a, priceMax: b })} />}
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
