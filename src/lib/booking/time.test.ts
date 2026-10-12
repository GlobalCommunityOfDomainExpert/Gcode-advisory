import { describe, expect, it } from "vitest";
import { clock, dayKey, daysBetween, daysInMonth, fmtDay, fmtTime, istDay, monthCells, parseDay, rupees, secondsLeft, shiftMonth, timeAgo } from "./time";

describe("India time", () => {
  it("reads the IST calendar day of an instant, not the UTC one", () => {
    expect(istDay("2026-10-09T20:00:00Z")).toBe("2026-10-10"); // 01:30 IST next day
    expect(istDay("2026-10-09T18:29:59Z")).toBe("2026-10-09"); // 23:59:59 IST
    expect(istDay("2026-10-09T18:30:00Z")).toBe("2026-10-10"); // exactly midnight IST
  });

  it("shows slot times in IST whatever the browser timezone", () => {
    expect(fmtTime("2026-10-20T03:30:00Z")).toBe("9:00 am");
    expect(fmtTime("2026-10-20T04:30:00Z")).toBe("10:00 am");
    expect(fmtTime("2026-10-20T08:30:00Z")).toBe("2:00 pm");
    expect(fmtTime("2026-10-20T18:00:00Z")).toBe("11:30 pm");
  });

  it("formats a day from a bare date or an instant", () => {
    expect(fmtDay("2026-10-10")).toBe("Sat, 10 Oct");
    expect(fmtDay("2026-10-09T20:00:00Z")).toBe("Sat, 10 Oct"); // next day in IST
  });
});

describe("rupees", () => {
  it("writes paise as rupees with Indian grouping", () => {
    expect(rupees(50000)).toBe("₹500");
    expect(rupees(120000)).toBe("₹1,200");
    expect(rupees(123456)).toBe("₹1,234.56");
    expect(rupees(10000000)).toBe("₹1,00,000");
  });
  it("calls zero Free", () => {
    expect(rupees(0)).toBe("Free");
  });
});

describe("calendar maths", () => {
  it("builds the month grid from a Sunday start", () => {
    const cells = monthCells(2026, 9); // October 2026 starts on a Thursday
    expect(cells.slice(0, 4).every((c) => c.day === null)).toBe(true);
    expect(cells[4]).toEqual({ day: "2026-10-01", label: 1 });
    expect(cells).toHaveLength(4 + 31);
    expect(cells.at(-1)).toEqual({ day: "2026-10-31", label: 31 });
  });

  it("knows month lengths, including February in a leap year", () => {
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2028, 1)).toBe(29);
    expect(daysInMonth(2026, 11)).toBe(31);
  });

  it("moves between months across the year end", () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ y: 2027, m: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ y: 2025, m: 11 });
    expect(shiftMonth(2026, 9, 3)).toEqual({ y: 2027, m: 0 });
  });

  it("counts days between two days", () => {
    expect(daysBetween("2026-10-09", "2026-10-10")).toBe(1);
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
    expect(daysBetween("2026-10-10", "2026-10-09")).toBe(-1);
  });

  it("round-trips day keys", () => {
    expect(dayKey(2026, 0, 5)).toBe("2026-01-05");
    expect(parseDay("2026-01-05")).toEqual({ y: 2026, m: 0, d: 5 });
  });
});

describe("the 15-minute hold", () => {
  const at = (iso: string) => new Date(iso).getTime();
  it("counts down in whole seconds and never goes negative", () => {
    expect(secondsLeft("2026-10-09T10:15:00Z", at("2026-10-09T10:00:00Z"))).toBe(900);
    expect(secondsLeft("2026-10-09T10:15:00Z", at("2026-10-09T10:14:59.400Z"))).toBe(0);
    expect(secondsLeft("2026-10-09T10:15:00Z", at("2026-10-09T10:20:00Z"))).toBe(0);
    expect(secondsLeft(null)).toBe(0);
  });
  it("shows minutes and seconds", () => {
    expect(clock(900)).toBe("15:00");
    expect(clock(754)).toBe("12:34");
    expect(clock(5)).toBe("0:05");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-12T10:00:00Z").getTime();
  const ago = (s: number) => new Date(now - s * 1000).toISOString();
  it("reads naturally at each scale", () => {
    expect(timeAgo(ago(5), now)).toBe("just now");
    expect(timeAgo(ago(5 * 60), now)).toBe("5 min ago");
    expect(timeAgo(ago(3 * 3600), now)).toBe("3 h ago");
    expect(timeAgo(ago(2 * 86400), now)).toBe("2 d ago");
  });
  it("falls back to a date after a week, and never goes negative for a future time", () => {
    expect(timeAgo(ago(10 * 86400), now)).toMatch(/Oct/);
    expect(timeAgo(ago(-60), now)).toBe("just now");
  });
});
