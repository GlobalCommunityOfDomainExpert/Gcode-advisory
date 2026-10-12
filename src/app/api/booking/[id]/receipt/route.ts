import { fail, isResponse, json, limited } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { Receipt } from "@/lib/booking/types";

/** The receipt for a paid booking (the booker) or the earnings line (the expert): GET /api/booking/42/receipt */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!isNumericId(id)) return fail("We couldn’t find that receipt.", 404);
  const blocked = limited([[`booking:receipt:${ctx.session.userId}`, 60, 10 * 60]]);
  if (blocked) return blocked;
  const res = await ords<Receipt>(`/bookings/${id}/receipt`, { token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
