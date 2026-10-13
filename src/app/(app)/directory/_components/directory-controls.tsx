"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, ChevronDown, X } from "lucide-react";
import { Icon } from "@/components/atoms";
import { SearchBar } from "@/components/molecules";
import { directoryHref, type DirectoryQuery } from "@/lib/booking/directory-query";
import type { DirectoryFilters, DirectorySort } from "@/lib/booking/types";

const SORTS: [DirectorySort, string][] = [
  ["relevance", "Relevance"],
  ["rating", "Highest rated"],
  ["price", "Price: low to high"],
];

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

/** The slider's scale from the dearest session on offer: a round top and a step that suits it. */
export function priceScale(maxMinor: number): { top: number; step: number } {
  const max = Math.max(1, Math.ceil(maxMinor / 100));
  const step = max <= 2000 ? 50 : max <= 10000 ? 100 : 500;
  return { top: Math.max(step * 2, Math.ceil(max / step) * step), step };
}

/**
 * The Price chip: it opens a panel with a two-handled slider. The handles can't cross and always keep a minimum range between them. Nothing to
 * press: the filter applies when a handle is let go. The lowest handle at the start and the highest at the end mean "no limit" on that
 * side, so the address only carries a limit you actually set.
 */
function PricePicker({ min, max, top, step, onApply }: { min: string; max: string; top: number; step: number; onApply: (min: string, max: string) => void }) {
  const [open, setOpen] = useState(false);
  const clamp = (n: number) => Math.min(top, Math.max(0, n));
  // the handles always keep this much between them (about 8% of the scale, in whole steps), so the range never collapses to one price
  const gap = Math.max(step, Math.ceil((top * 0.08) / step) * step);
  const fromQuery = () => ({ lo: clamp(min ? Number(min) : 0), hi: clamp(max ? Number(max) : top) });
  const [{ lo, hi }, setRange] = useState(fromQuery);
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
    if (!open) setRange(fromQuery());
    setOpen(!open);
  }

  // let go of a handle: apply (an end of the scale means no limit on that side)
  const commit = () => onApply(lo <= 0 ? "" : String(lo), hi >= top ? "" : String(hi));
  const pct = (n: number) => `${(n / top) * 100}%`;

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
        <div role="dialog" aria-label="Price range" className="border-border-light bg-surface-light absolute top-full left-0 z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-md border p-5 shadow-lg">
          <div className="flex items-baseline justify-between">
            <p className="text-small text-text-secondary font-semibold">Price per session</p>
            <p className="text-body text-text-primary font-semibold tabular-nums" aria-live="polite">
              {rupee(String(lo))} – {rupee(String(hi))}
              {hi >= top ? "+" : ""}
            </p>
          </div>
          <div className="dual-range relative mt-5 mb-1 h-6">
            <div className="bg-bg-light absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full" />
            <div className="bg-secondary absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full" style={{ left: pct(lo), right: `calc(100% - ${pct(hi)})` }} />
            <input
              type="range"
              aria-label="Lowest price"
              min={0}
              max={top}
              step={step}
              value={lo}
              onChange={(e) => setRange({ lo: Math.min(Number(e.target.value), hi - gap), hi })}
              onPointerUp={commit}
              onKeyUp={commit}
            />
            <input
              type="range"
              aria-label="Highest price"
              min={0}
              max={top}
              step={step}
              value={hi}
              onChange={(e) => setRange({ lo, hi: Math.max(Number(e.target.value), lo + gap) })}
              onPointerUp={commit}
              onKeyUp={commit}
            />
          </div>
          <div className="text-small text-text-secondary mt-1 flex justify-between tabular-nums">
            <span>{rupee("0")}</span>
            <span>{rupee(String(top))}+</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {active ? (
              <button
                type="button"
                onClick={() => {
                  setRange({ lo: 0, hi: top });
                  setOpen(false);
                  onApply("", "");
                }}
                className="text-small text-text-secondary hover:text-text-primary focus-visible:ring-primary rounded-sm font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                Clear price
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => {
                // the filter already applied when a handle was let go; Done confirms it and closes the panel
                setOpen(false);
              }}
              className="bg-primary text-small hover:bg-primary-hover focus-visible:ring-primary rounded-sm px-4 py-2 font-bold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Done
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
          {filters.paymentsEnabled && filters.maxPriceMinor > 0 && <PricePicker min={query.priceMin} max={query.priceMax} {...priceScale(filters.maxPriceMinor)} onApply={(a, b) => go({ priceMin: a, priceMax: b })} />}
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
