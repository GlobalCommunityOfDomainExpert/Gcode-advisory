"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Icon } from "@/components/atoms";
import { focusRing } from "@/lib/ui";

export interface CalendarPickerProps {
  year: number;
  /** 0–11 */
  month: number;
  /** `YYYY-MM-DD` of the chosen date. */
  selectedKey?: string;
  /** A date with at least one open slot. */
  isAvailable: (date: Date) => boolean;
  /** An account-wide day off (shown struck through). */
  isDayOff?: (date: Date) => boolean;
  onPick?: (key: string, date: Date) => void;
  /** -1 for the previous month, 1 for the next. */
  onNavigate?: (delta: -1 | 1) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Month calendar for picking a booking date. Built to be mobile-safe: always 7 fluid columns (`grid-cols-7`, `min-w-0`,
 * fixed 40px rows) so every date is visible from 320px up; weekday headers collapse to one letter on small screens.
 */
export function CalendarPicker({
  year,
  month,
  selectedKey,
  isAvailable,
  isDayOff = () => false,
  onPick,
  onNavigate,
}: CalendarPickerProps) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onNavigate?.(-1)}
          aria-label="Previous month"
          className={`text-text-secondary hover:bg-bg-light ${focusRing} rounded-sm p-2`}
        >
          <Icon icon={ChevronLeft} size="sm" />
        </button>
        <p className="text-body text-text-primary font-semibold">
          {MONTHS[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => onNavigate?.(1)}
          aria-label="Next month"
          className={`text-text-secondary hover:bg-bg-light ${focusRing} rounded-sm p-2`}
        >
          <Icon icon={ChevronRight} size="sm" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-small text-text-secondary py-1 font-medium">
            <span className="sm:hidden">{w[0]}</span>
            <span className="hidden sm:inline">{w}</span>
          </span>
        ))}
        {Array.from({ length: firstWeekday }, (_, i) => (
          <span key={`pad-${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const d = new Date(year, month, day);
          const key = dateKey(d);
          const avail = isAvailable(d);
          const off = isDayOff(d);
          const sel = key === selectedKey;
          const tone = sel
            ? "bg-primary text-white font-bold"
            : avail
              ? "bg-primary-light text-primary font-semibold hover:bg-primary/15"
              : off
                ? "text-text-secondary/50 line-through"
                : "text-text-secondary/40";
          return (
            <button
              key={key}
              type="button"
              disabled={!avail}
              onClick={() => onPick?.(key, d)}
              title={off ? "Day off" : undefined}
              aria-label={`${d.toDateString()}${avail ? "" : off ? " — day off" : " — unavailable"}`}
              aria-pressed={sel}
              className={`text-small ${focusRing} h-10 w-full min-w-0 rounded-sm transition-colors ${tone} ${
                avail ? "cursor-pointer" : "cursor-not-allowed"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="text-small text-text-secondary mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5">
          <span className="bg-primary-light size-3 rounded-sm" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-primary size-3 rounded-sm" />
          Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-text-secondary/50 line-through">12</span>Day off
        </span>
      </div>
    </div>
  );
}
