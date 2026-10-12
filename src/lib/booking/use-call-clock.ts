"use client";

import { useCallback, useEffect, useState } from "react";
import { extendSession, getCallClock } from "./client";

/** The warning shows once this much time is left. */
export const WARN_MS = 5 * 60_000;
const POLL_MS = 15_000;

export interface CallClock {
  /** Milliseconds to the scheduled end, never below 0. */
  left: number;
  /** "ok" until five minutes are left, "warn" for the last five minutes, "ended" once the time is up. */
  phase: "ok" | "warn" | "ended";
  /** Minutes the expert has added so far. */
  extendedMin: number;
  /** This person is the expert and may add 15 more minutes right now. */
  canExtend: boolean;
  extending: boolean;
  extendError: string | null;
  extend: () => Promise<void>;
}

/**
 * Counts down to the session's end (once a second) and asks the server every 15 seconds whether the end moved: the expert can add
 * time, and the other person's page learns of it from here. The clock is the browser's; the server's room window is the real limit.
 */
export function useCallClock(slug: string, initialEndAt: string, bookingId: number): CallClock {
  const [end, setEnd] = useState(() => new Date(initialEndAt).getTime());
  const [now, setNow] = useState(() => Date.now());
  const [extendedMin, setExtendedMin] = useState(0);
  const [canExtend, setCanExtend] = useState(false);
  const [extending, setExtending] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);

  const apply = useCallback((c: { endAt: string; extendedMin: number; canExtend: boolean }) => {
    setEnd(new Date(c.endAt).getTime());
    setExtendedMin(c.extendedMin);
    setCanExtend(c.canExtend);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    async function poll() {
      const res = await getCallClock(slug);
      if (alive && res.ok && res.data) apply(res.data);
    }
    void poll();
    const t = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [slug, apply]);

  const extend = useCallback(async () => {
    setExtending(true);
    setExtendError(null);
    const res = await extendSession(bookingId);
    setExtending(false);
    if (res.ok && res.data) apply(res.data);
    else setExtendError(res.error ?? "We couldn’t extend the session.");
  }, [bookingId, apply]);

  const left = Math.max(0, end - now);
  return { left, phase: left <= 0 ? "ended" : left <= WARN_MS ? "warn" : "ok", extendedMin, canExtend, extending, extendError, extend };
}

/** "4:59", "12:03" or "1:02:03". */
export function mmss(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}
