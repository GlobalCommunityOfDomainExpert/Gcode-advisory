/**
 * Date and money helpers for booking. Everything here works in India Standard Time (the only timezone at launch),
 * and never reads the browser's own timezone, so a visitor abroad sees the same slots as one in Bengaluru.
 * Calendar days are plain "YYYY-MM-DD" strings; instants from the backend are ISO strings in UTC.
 */

const IST = "Asia/Kolkata";

const dayParts = new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true });
const dayFmt = new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short" });
const longDayFmt = new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n: number) => String(n).padStart(2, "0");

/** The IST calendar day of an instant (default: now), as YYYY-MM-DD. */
export function istDay(at: Date | string = new Date()): string {
  return dayParts.format(typeof at === "string" ? new Date(at) : at);
}

/** "10:30 am" in IST. */
export function fmtTime(iso: string): string {
  return timeFmt.format(new Date(iso)).replace("AM", "am").replace("PM", "pm");
}

/** "Fri, 9 Oct" for an instant or a YYYY-MM-DD day. */
export function fmtDay(value: string): string {
  return dayFmt.format(toDate(value));
}

const colFmt = new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short" });

/** The three lines of the timeline's date column: "Mon", "12", "Oct" (IST). */
export function dateColumn(value: string): { weekday: string; day: string; month: string } {
  const parts = colFmt.formatToParts(toDate(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { weekday: get("weekday"), day: get("day"), month: get("month") };
}

/** Is this time on today's date in India? */
export function isToday(value: string, now: Date = new Date()): boolean {
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(d);
  return day(toDate(value)) === day(now);
}

export function fmtDayLong(value: string): string {
  return longDayFmt.format(toDate(value));
}

function toDate(value: string): Date {
  // A bare day is read as noon UTC so no timezone can push it onto a neighbouring day.
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
}

/** Rupees from paise, Indian digit grouping. 50000 -> "₹500", 123456 -> "₹1,234.56", 0 -> "Free". */
export function rupees(minor: number): string {
  if (minor === 0) return "Free";
  const value = minor / 100;
  return "₹" + value.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 });
}

export function dayKey(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export function parseDay(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m: m - 1, d };
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
}

export interface MonthCell {
  /** null for the blank cells before the 1st. */
  day: string | null;
  label: number | null;
}

/** The cells of a month grid starting on Sunday: leading blanks, then every day. */
export function monthCells(y: number, m: number): MonthCell[] {
  const lead = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const cells: MonthCell[] = Array.from({ length: lead }, () => ({ day: null, label: null }));
  for (let d = 1; d <= daysInMonth(y, m); d++) cells.push({ day: dayKey(y, m, d), label: d });
  return cells;
}

/** Whole days from one YYYY-MM-DD to another (negative if the second is earlier). */
export function daysBetween(from: string, to: string): number {
  const a = parseDay(from);
  const b = parseDay(to);
  return Math.round((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / 86_400_000);
}

/** The month before or after (y, m). */
export function shiftMonth(y: number, m: number, by: number): { y: number; m: number } {
  const total = y * 12 + m + by;
  return { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
}

/** Whole seconds left until an instant, never negative. */
export function secondsLeft(iso: string | null, now: number = Date.now()): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000));
}

/** 754 -> "12:34". */
/** "just now", "5 min ago", "3 h ago", "2 d ago", then a short date. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return fmtDay(iso);
}

export function clock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
}
