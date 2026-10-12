import { fail, isResponse, json, limited } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { BookingView } from "@/lib/booking/types";

/** One booking, for either of its two people: GET /api/booking/42 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!isNumericId(id)) return fail("We couldn’t find that booking.", 404);

  const blocked = limited([[`booking:read:${ctx.session.userId}`, 600, 10 * 60]]);
  if (blocked) return blocked;

  const res = await ords<BookingView>(`/bookings/${id}`, { token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
