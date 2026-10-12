import { DAY_KEYS, type DayKey, type Service } from "./types";

export const DAY_LABEL: Record<DayKey, string> = { sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat" };

/** A blank service. While payments are off it starts free (rate 0), so the editor never has to ask for a price. */
export const newService = (freeOnly = false): Service => ({
  type: "",
  contribution: "",
  duration: "30 min",
  buffer: "10 min",
  rate: freeOnly ? "0" : "",
  mode: "rolling",
  from: "",
  to: "",
  days: Object.fromEntries(DAY_KEYS.map((k) => [k, { on: k === "mon" || k === "wed", s: "10:00", e: "12:00" }])) as Service["days"],
});

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
export const durationMinutes = (d: string) => (/hr/.test(d) ? 60 : parseInt(d, 10));
export const bufferMinutes = (b: string) => (b === "No buffer" ? 0 : parseInt(b, 10));

/**
 * Bookable slots per week: each enabled day's window is sliced into (session length + buffer) steps.
 * The one shared slot rule: the booking calendar (Sprint 3) must reuse it, not re-implement it.
 */
export function slotsPerWeek(s: Service): number {
  const dur = durationMinutes(s.duration);
  const gap = bufferMinutes(s.buffer);
  return DAY_KEYS.reduce((n, k) => {
    const d = s.days[k];
    if (!d.on) return n;
    let count = 0;
    for (let t = toMin(d.s); t + dur <= toMin(d.e); t += dur + gap) count++;
    return n + count;
  }, 0);
}

export const rateLabel = (s: Service) =>
  s.rate === "" ? "Rate not set" : Number(s.rate) === 0 ? "FREE" : `₹${Number(s.rate).toLocaleString("en-IN")}`;

export function serviceSummary(s: Service): string {
  const days = DAY_KEYS.filter((k) => s.days[k].on).map((k) => DAY_LABEL[k]);
  return [s.duration, rateLabel(s), days.length ? days.join(", ") : "No days set", s.mode === "rolling" ? "Rolling" : s.to ? `Until ${s.to}` : "Fixed dates"].join(" · ");
}

export const isPaid = (s: Service) => s.rate !== "" && Number(s.rate) > 0;

/** Whole days until an "until" window ends (negative once it has). Null for rolling windows. */
export function daysLeft(s: Service, today = new Date()): number | null {
  if (s.mode !== "until" || !s.to) return null;
  const end = new Date(`${s.to}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
}
