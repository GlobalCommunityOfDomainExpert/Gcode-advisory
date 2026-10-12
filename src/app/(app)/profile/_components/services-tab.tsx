"use client";

import { useState } from "react";
import { CalendarClock, CalendarOff, CalendarRange, ChevronDown, ChevronUp, Copy, HeartHandshake, RefreshCw, Users, Wallet } from "lucide-react";
import { Button, Checkbox, Input, Label, RemoveIconButton, Select } from "@/components/atoms";
import { Banner, EmptyState, FormField, IconTile } from "@/components/molecules";
import { BUFFERS, DURATIONS, SERVICE_TYPES, TIME_OPTS } from "@/lib/profile/options";
import { DAY_LABEL, daysLeft, isPaid, newService, serviceSummary, slotsPerWeek } from "@/lib/profile/services";
import { DAY_KEYS, type DayKey, type DayOff, type Engagement, type Service } from "@/lib/profile/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/ui";
import { Grid2, SearchSelect } from "./fields";

export const ENGAGE_OPTS: { value: Engagement; title: string; sub: string; icon: typeof Wallet }[] = [
  { value: "paid", title: "Paid sessions", sub: "Set a rate and get booked", icon: Wallet },
  { value: "free", title: "Free sessions", sub: "Volunteer time for learners", icon: HeartHandshake },
  { value: "community", title: "Community member", sub: "Listed on GCODE, not bookable", icon: Users },
];

/** Radio-style choice card used for participation and for the availability window. */
function ChoiceCard({ selected, icon, title, sub, onSelect, disabled = false }: { selected: boolean; icon: typeof Wallet; title: string; sub: string; onSelect: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-md border-2 p-4 text-left transition-colors",
        focusRing,
        disabled && "cursor-not-allowed opacity-60",
        selected ? "border-primary bg-primary-light" : disabled ? "border-border-light bg-surface-light" : "border-border-light bg-surface-light hover:border-border-hover",
      )}
    >
      <IconTile icon={icon} tone={selected ? "solid" : "neutral"} />
      <span className="min-w-0">
        <span className="text-body text-text-primary block font-semibold">{title}</span>
        <span className="text-small text-text-secondary">{sub}</span>
      </span>
    </button>
  );
}

/** While payments are off the paid option is shown but cannot be chosen. */
export function EngagementChooser({ value, onChange, paymentsEnabled }: { value: string; onChange: (v: Engagement) => void; paymentsEnabled: boolean }) {
  return (
    <FormField label="How would you like to participate?" htmlFor="engage" hint="Only experts offering sessions can be booked. You can change this any time.">
      <div id="engage" role="radiogroup" aria-label="Participation" className="grid gap-3 sm:grid-cols-3">
        {ENGAGE_OPTS.map((o) => (
          <ChoiceCard
            key={o.value}
            selected={value === o.value}
            icon={o.icon}
            title={o.title}
            sub={o.value === "paid" && !paymentsEnabled ? "Coming soon: free sessions for now" : o.sub}
            disabled={o.value === "paid" && !paymentsEnabled && value !== "paid"}
            onSelect={() => onChange(o.value)}
          />
        ))}
      </div>
    </FormField>
  );
}

function WeeklyGrid({ service, index, onDay, onCopy }: { service: Service; index: number; onDay: (k: DayKey, patch: Partial<Service["days"][DayKey]>) => void; onCopy: (from: DayKey, to: DayKey) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label>Weekly availability</Label>
        <span className="text-small text-text-secondary">≈ {slotsPerWeek(service)} bookable slots per week</span>
      </div>
      <div className="border-border-light bg-surface-light divide-border-light divide-y rounded-md border">
        {DAY_KEYS.map((k, i) => {
          const d = service.days[k];
          const next = DAY_KEYS[i + 1];
          return (
            <div key={k} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
              <div className="w-20">
                <Checkbox id={`svc-${index}-${k}`} label={DAY_LABEL[k]} checked={d.on} onChange={(e) => onDay(k, { on: e.target.checked })} />
              </div>
              {d.on ? (
                <>
                  <div className="w-28">
                    <Select aria-label={`${DAY_LABEL[k]} start time`} value={d.s} onChange={(e) => onDay(k, { s: e.target.value })}>
                      {TIME_OPTS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </Select>
                  </div>
                  <span className="text-small text-text-secondary">to</span>
                  <div className="w-28">
                    <Select aria-label={`${DAY_LABEL[k]} end time`} value={d.e} error={d.e <= d.s} onChange={(e) => onDay(k, { e: e.target.value })}>
                      {TIME_OPTS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </Select>
                  </div>
                  {d.e <= d.s ? (
                    <span className="text-small text-danger">End must be after start</span>
                  ) : next ? (
                    <button type="button" onClick={() => onCopy(k, next)} className={cn("text-small text-primary ml-auto inline-flex items-center gap-1.5 rounded-sm font-medium underline-offset-2 hover:underline", focusRing)}>
                      <Copy className="size-3.5" aria-hidden="true" /> Copy to {DAY_LABEL[next]}
                    </button>
                  ) : null}
                </>
              ) : (
                <span className="text-small text-text-secondary">Unavailable</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WindowBlock({ service, index, onChange }: { service: Service; index: number; onChange: (patch: Partial<Service>) => void }) {
  const left = daysLeft(service);
  return (
    <div className="space-y-3">
      <Label>How long are these hours open?</Label>
      <div role="radiogroup" aria-label="Availability window" className="grid gap-3 sm:grid-cols-2">
        <ChoiceCard selected={service.mode === "rolling"} icon={RefreshCw} title="Rolling" sub="Always open for the next 60 days. Renews itself whenever you log in." onSelect={() => onChange({ mode: "rolling" })} />
        <ChoiceCard selected={service.mode === "until"} icon={CalendarRange} title="Until a date" sub="Open between two dates. We’ll remind you to renew before it ends." onSelect={() => onChange({ mode: "until" })} />
      </div>
      {service.mode === "until" && (
        <Grid2>
          <FormField label="Available from" htmlFor={`svc-${index}-from`}>
            <Input id={`svc-${index}-from`} type="date" value={service.from} onChange={(e) => onChange({ from: e.target.value })} />
          </FormField>
          <FormField label="Available until" htmlFor={`svc-${index}-to`} error={service.from && service.to && service.to < service.from ? "End date is before the start." : undefined}>
            <Input id={`svc-${index}-to`} type="date" value={service.to} onChange={(e) => onChange({ to: e.target.value })} />
          </FormField>
        </Grid2>
      )}
      {left !== null && left <= 14 && (
        <Banner tone="warning">
          <span className="flex flex-wrap items-center justify-between gap-3">
            <span>{left < 0 ? "This window has ended: nobody can book you." : `This window ends in ${left} day${left === 1 ? "" : "s"}.`}</span>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const base = new Date(`${service.to}T00:00:00`);
                const next = new Date(base.getFullYear(), base.getMonth() + 3, base.getDate());
                const pad = (n: number) => String(n).padStart(2, "0");
                onChange({ to: `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}` });
              }}
            >
              Renew for 3 months
            </Button>
          </span>
        </Banner>
      )}
    </div>
  );
}

function ServiceCard({ service, index, open, paymentsEnabled, onToggle, onRemove, onChange }: { service: Service; index: number; open: boolean; paymentsEnabled: boolean; onToggle: () => void; onRemove: () => void; onChange: (patch: Partial<Service>) => void }) {
  const id = (s: string) => `svc-${index}-${s}`;
  return (
    <div className="border-border-light bg-bg-subtle rounded-md border p-5">
      <div className="flex items-center gap-3">
        <IconTile icon={CalendarClock} tone="primary" size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-body text-text-primary truncate font-semibold">{service.type || "New service"}</p>
          <p className="text-small text-text-secondary truncate">{serviceSummary(service)}</p>
        </div>
        <button type="button" onClick={onToggle} aria-expanded={open} aria-label={`${open ? "Collapse" : "Expand"} service ${index + 1}`} className={cn("text-text-secondary hover:text-text-primary rounded-sm p-1.5", focusRing)}>
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        <RemoveIconButton ariaLabel={`Remove service ${index + 1}`} onClick={onRemove} />
      </div>
      {open && (
        <div className="border-border-light mt-5 space-y-6 border-t pt-5">
          <FormField label="Service offered" htmlFor={id("type")}>
            <SearchSelect id={id("type")} value={service.type} options={SERVICE_TYPES} placeholder="Choose what you offer" onChange={(v) => onChange({ type: v })} />
          </FormField>
          <FormField label="Your contribution" htmlFor={id("contribution")} hint="What people will get from a session with you.">
            <textarea
              id={id("contribution")}
              rows={3}
              maxLength={500}
              value={service.contribution}
              placeholder="e.g. I help early-stage teams pressure-test their go-to-market plan."
              onChange={(e) => onChange({ contribution: e.target.value })}
              className="text-body text-text-primary border-border-light bg-surface-light hover:border-border-hover focus-visible:border-primary focus-visible:ring-primary w-full rounded-sm border px-4 py-2 shadow-inner focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
          </FormField>
          <Grid2>
            <FormField label="Session length" htmlFor={id("duration")}>
              <Select id={id("duration")} value={service.duration} onChange={(e) => onChange({ duration: e.target.value })}>
                {DURATIONS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Buffer between sessions" htmlFor={id("buffer")} hint="Time to rest or prepare after each session.">
              <Select id={id("buffer")} value={service.buffer} onChange={(e) => onChange({ buffer: e.target.value })}>
                {BUFFERS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </Select>
            </FormField>
          </Grid2>
          {paymentsEnabled || isPaid(service) ? (
            <FormField
              label="Rate per session (₹)"
              htmlFor={id("rate")}
              hint={paymentsEnabled ? "Enter 0 for a free session. GCODE keeps 15% of paid sessions." : "Paid sessions are paused for now. Enter 0 to offer this one for free."}
            >
              <Input id={id("rate")} type="number" inputMode="numeric" min={0} max={100000} step={1} value={service.rate} placeholder="e.g. 1500" onChange={(e) => onChange({ rate: e.target.value.replace(/[^\d]/g, "").slice(0, 6) })} />
            </FormField>
          ) : (
            <p className="text-small text-text-secondary">This is a free session. Paid sessions are coming soon.</p>
          )}
          <WeeklyGrid
            service={service}
            index={index}
            onDay={(k, patch) => onChange({ days: { ...service.days, [k]: { ...service.days[k], ...patch } } })}
            onCopy={(from, to) => onChange({ days: { ...service.days, [to]: { ...service.days[to], on: true, s: service.days[from].s, e: service.days[from].e } } })}
          />
          <WindowBlock service={service} index={index} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function DaysOff({ value, onChange }: { value: DayOff[]; onChange: (next: DayOff[]) => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const add = () => {
    if (!from) return;
    const end = to && to >= from ? to : from;
    onChange([...value, { from, to: end }]);
    setFrom("");
    setTo("");
  };
  return (
    <div className="border-border-light space-y-4 border-t pt-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Label>Days off</Label>
        <span className="bg-primary-light text-primary text-small rounded-full px-2.5 py-0.5 font-medium">Applies to all services</span>
      </div>
      <p className="text-small text-text-secondary -mt-2">Block a date, or a stretch of dates, for leave or holidays. Nobody can book you on these days, for any service, and your weekly hours stay as they are.</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <FormField label="From" htmlFor="dayoff-from">
            <Input id="dayoff-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </FormField>
        </div>
        <div className="w-44">
          <FormField label="To (optional)" htmlFor="dayoff-to">
            <Input id="dayoff-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </FormField>
        </div>
        <Button type="button" variant="secondary" onClick={add} disabled={!from || value.length >= 50}>
          <CalendarOff className="size-4" aria-hidden="true" /> Add days off
        </Button>
      </div>
      {value.length ? (
        <div className="flex flex-wrap gap-2">
          {value.map((r, j) => (
            <span key={`${r.from}-${r.to}-${j}`} className="bg-bg-light text-text-primary text-small inline-flex items-center gap-1 rounded-full py-1 pr-1 pl-3 font-medium">
              {r.from === r.to ? fmt(r.from) : `${fmt(r.from)} – ${fmt(r.to)}`}
              <RemoveIconButton ariaLabel={`Remove days off ${r.from} to ${r.to}`} onClick={() => onChange(value.filter((_, k) => k !== j))} />
            </span>
          ))}
        </div>
      ) : (
        <p className="text-small text-text-secondary">No days off added.</p>
      )}
    </div>
  );
}

export interface ServicesTabProps {
  engagement: string;
  services: Service[];
  daysOff: DayOff[];
  payoutSet: boolean;
  /** false while only free sessions can be booked. */
  paymentsEnabled: boolean;
  onEngagement: (e: Engagement) => void;
  onServices: (next: Service[]) => void;
  onDaysOff: (next: DayOff[]) => void;
}

/**
 * Services & availability: the one place that replaces "My services", "My calendar" and "Booking pages".
 * A service is the bookable unit: length, buffer, rate, weekly hours and a window. Days off apply to all of them.
 */
export function ServicesTab({ engagement, services, daysOff, payoutSet, paymentsEnabled, onEngagement, onServices, onDaysOff }: ServicesTabProps) {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });
  const patch = (i: number, p: Partial<Service>) => onServices(services.map((s, j) => (j === i ? { ...s, ...p } : s)));

  if (engagement === "community") {
    return (
      <div className="space-y-5">
        <Banner tone="info">
          You’ve chosen to join as a <b>community member</b>: you’re listed on GCODE but can’t be booked, so no services are needed.
        </Banner>
        <Button type="button" variant="secondary" onClick={() => onEngagement(paymentsEnabled ? "paid" : "free")}>
          Offer sessions instead
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Banner tone="info">Each service is also bookable: people pick a time from the availability you set here. No separate booking page needed.</Banner>
      {!paymentsEnabled && services.some(isPaid) && (
        <Banner tone="warning">
          <b>Paid sessions are paused for now.</b> Services with a price can’t be booked yet; set the rate to 0 to offer one for free. Your prices are kept for when paid sessions open.
        </Banner>
      )}
      {paymentsEnabled && services.some(isPaid) && !payoutSet && (
        <Banner tone="warning">
          <b>Paid sessions need a payout account.</b> Until you add one, paid services stay paused and people cannot book them. Add it in Account settings, under Payouts. Free services are unaffected.
        </Banner>
      )}
      {services.length ? (
        <div className="space-y-4">
          {services.map((s, i) => (
            <ServiceCard
              key={i}
              service={s}
              index={i}
              open={!!open[i]}
              paymentsEnabled={paymentsEnabled}
              onToggle={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}
              onRemove={() => {
                onServices(services.filter((_, j) => j !== i));
                setOpen({});
              }}
              onChange={(p) => patch(i, p)}
            />
          ))}
        </div>
      ) : (
        <div className="border-border-hover rounded-md border-2 border-dashed">
          <EmptyState icon={CalendarClock} bordered={false} title="Add your first service" description="Without a service and availability, nobody can book you. Choose what you offer, set your rate and pick the hours you’re free." />
        </div>
      )}
      {services.length < 10 && (
        <Button
          type="button"
          variant={services.length ? "secondary" : "primary"}
          className="w-full"
          onClick={() => {
            setOpen({ [services.length]: true });
            onServices([...services, newService(!paymentsEnabled)]);
          }}
        >
          + Add {services.length ? "another " : "a "}service
        </Button>
      )}
      <DaysOff value={daysOff} onChange={onDaysOff} />
    </div>
  );
}
