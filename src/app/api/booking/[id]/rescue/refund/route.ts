import { fail, isResponse, json, limited } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { BookingView } from "@/lib/booking/types";

/** POST /api/booking/42/rescue/refund: "No thanks, refund me". The refund starts now. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!isNumericId(id)) return fail("We couldn’t find that booking.", 404);
  const blocked = limited([[`booking:rescue:${ctx.session.userId}`, 60, 10 * 60]]);
  if (blocked) return blocked;
  const res = await ords<BookingView>(`/bookings/${id}/rescue/refund`, { method: "POST", body: {}, token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
