import { NextResponse } from "next/server";
import { siteOrigin } from "./env";
import { hit, type LimitResult } from "./rate-limit";

const MAX_BODY_BYTES = 8 * 1024;

/** The caller's address. x-forwarded-for is only trustworthy behind a proxy that overwrites it; set that up at the edge. */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export const fail = (error: string, status = 400) => json({ error }, status);

function tooMany(limit: LimitResult): NextResponse {
  return json({ error: "Too many attempts. Please wait a few minutes and try again." }, 429, {
    "Retry-After": String(limit.retryAfterSeconds),
  });
}

/** Applies every limit; returns a 429 response for the first one exceeded, otherwise null. */
export function limited(rules: [key: string, max: number, windowSeconds: number][]): NextResponse | null {
  for (const [key, max, windowSeconds] of rules) {
    const result = hit(key, max, windowSeconds);
    if (!result.allowed) return tooMany(result);
  }
  return null;
}

/**
 * Gate for every state-changing auth request, run before anything else:
 *  - same-origin only: the Origin header must be this site and Sec-Fetch-Site must not say cross-site. With
 *    SameSite=Lax cookies this closes CSRF
 *  - JSON content type only, so a plain HTML form can't post here
 *  - a small body, parsed safely
 */
export async function readJson(request: Request): Promise<Record<string, unknown> | NextResponse> {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (origin !== siteOrigin() || (fetchSite && fetchSite !== "same-origin")) return fail("Request blocked.", 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return fail("Unsupported request.", 415);

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return fail("Request too large.", 413);
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : fail("Invalid request.");
  } catch {
    return fail("Invalid request.");
  }
}

export const isResponse = (v: unknown): v is NextResponse => v instanceof NextResponse;

export const str = (v: unknown): string => (typeof v === "string" ? v : "");
