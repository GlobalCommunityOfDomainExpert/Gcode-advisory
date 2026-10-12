import type { NextResponse } from "next/server";
import { fail } from "./guard";
import type { OrdsResult } from "./ords";

type Failed = Extract<OrdsResult<unknown>, { ok: false }>;

/**
 * Turns a failed backend call into our own response. The booking backend words its 400, 404 and 409 answers for
 * people ("That time is no longer available"), so those pass through. Anything else (outage, bug) becomes one
 * generic message and the detail stays in the server log.
 */
export function relayError(res: Failed): NextResponse {
  if (res.status === 401) return fail("Please sign in again.", 401);
  if ([400, 403, 404, 409].includes(res.status)) {
    // ORDS' own error pages come back as "HTTP 404": not a message anyone should read.
    return fail(/^HTTP \d+$/.test(res.message) ? "We couldn’t find that." : res.message, res.status);
  }
  return fail("Something went wrong. Please try again.", 502);
}

/** A plain database id: digits only, so it is safe to put in a backend URL. */
export const isNumericId = (v: unknown): v is string => typeof v === "string" && /^\d{1,18}$/.test(v);

/** A calendar day: YYYY-MM-DD. */
export const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** An ISO instant as the backend writes them: 2026-10-20T04:30:00Z. */
export const isInstant = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v);
