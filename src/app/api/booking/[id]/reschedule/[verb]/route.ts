import { fail, isResponse, json, limited } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { BookingView } from "@/lib/booking/types";

const VERBS = new Set(["accept", "decline", "withdraw"]);

/**
 * Answer a suggested new time: POST /api/booking/42/reschedule/accept, /decline or /withdraw.
 * The other person accepts or declines; the person who suggested it can withdraw. Who may do what is the backend's call.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string; verb: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id, verb } = await params;
  if (!isNumericId(id) || !VERBS.has(verb)) return fail("We couldn’t find that booking.", 404);
  const blocked = limited([[`booking:reschedule:${ctx.session.userId}`, 60, 10 * 60]]);
  if (blocked) return blocked;
  const res = await ords<BookingView>(`/bookings/${id}/reschedule/${verb}`, { method: "POST", body: {}, token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
