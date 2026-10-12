"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Icon } from "@/components/atoms";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/ui";
import { MONTHS, WEEKDAYS, fmtDayLong, monthCells, shiftMonth } from "@/lib/booking/time";

export interface CalendarProps {
  y: number;
  m: number;
  /** Today in IST (YYYY-MM-DD). Earlier days are never offered. */
  today: string;
  /** Open slots per day for this month; null while they load. */
  counts: Record<string, number> | null;
  selected: string | null;
  onPick: (day: string) => void;
  onMonth: (y: number, m: number) => void;
}

/**
 * Month grid for choosing a day. Built mobile-safe: always 7 fluid columns (grid-cols-7, min-w-0, fixed 40px rows) so
 * every date stays visible and tappable from 320px up. Days with no open time are disabled.
 */
export function Calendar({ y, m, today, counts, selected, onPick, onMonth }: CalendarProps) {
  const t = { y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 };
  const monthsFromNow = (y - t.y) * 12 + (m - t.m);
  const prev = shiftMonth(y, m, -1);
  const next = shiftMonth(y, m, 1);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={monthsFromNow <= 0}
          onClick={() => onMonth(prev.y, prev.m)}
          className={cn("text-text-secondary hover:bg-bg-light rounded-sm p-2 disabled:opacity-40", focusRing)}
        >
          <Icon icon={ChevronLeft} size="sm" />
        </button>
        <p className="text-body text-text-primary font-semibold" aria-live="polite">
          {MONTHS[m]} {y}
        </p>
        <button
          type="button"
          aria-label="Next month"
          disabled={monthsFromNow >= 3}
          onClick={() => onMonth(next.y, next.m)}
          className={cn("text-text-secondary hover:bg-bg-light rounded-sm p-2 disabled:opacity-40", focusRing)}
        >
          <Icon icon={ChevronRight} size="sm" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" aria-busy={counts === null}>
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-small text-text-secondary py-1 font-medium">
            <span className="sm:hidden">{w[0]}</span>
            <span className="hidden sm:inline">{w}</span>
          </span>
        ))}
        {monthCells(y, m).map((cell, i) => {
          if (!cell.day) return <span key={`blank-${i}`} aria-hidden="true" />;
          const open = counts !== null && cell.day >= today && (counts[cell.day] ?? 0) > 0;
          const isSelected = cell.day === selected;
          return (
            <button
              key={cell.day}
              type="button"
              disabled={!open}
              aria-pressed={isSelected}
              aria-label={`${fmtDayLong(cell.day)}${counts === null ? "" : open ? ", times available" : ", no times available"}`}
              onClick={() => onPick(cell.day as string)}
              className={cn(
                "text-small h-10 w-full min-w-0 rounded-sm transition-colors",
                focusRing,
                isSelected
                  ? "bg-primary font-bold text-white"
                  : open
                    ? "bg-primary-light text-primary hover:bg-primary/15 cursor-pointer font-semibold"
                    : "text-text-secondary/40 cursor-not-allowed",
                counts === null && "animate-pulse",
              )}
            >
              {cell.label}
            </button>
          );
        })}
      </div>

      <div className="text-small text-text-secondary mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5">
          <span className="bg-primary-light size-3 rounded-sm" />
          Times available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-primary size-3 rounded-sm" />
          Selected
        </span>
      </div>
    </div>
  );
}
