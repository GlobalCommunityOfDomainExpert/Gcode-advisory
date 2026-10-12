import { fail, isResponse, json } from "@/lib/server/guard";
import { relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { CallClockInfo } from "@/lib/booking/types";

const SLUG = /^[a-z0-9-]{8,20}$/;

/** The session's current end, for the call page's countdown (the expert may have extended it). Read-only: it does not count as joining. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const slug = (await params).slug.toLowerCase();
  if (!SLUG.test(slug)) return fail("We couldn’t find that session.", 404);
  const res = await ords<CallClockInfo>(`/bookings/call/${slug}/clock`, { token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
