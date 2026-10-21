import { fail, isResponse, json } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { CancelQuote } from "@/lib/booking/types";

/** GET /api/booking/42/cancel-quote: what cancelling would cost right now. Read-only; the rules live in the database. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!isNumericId(id)) return fail("We couldn’t find that booking.", 404);
  const res = await ords<CancelQuote>(`/bookings/${id}/cancel-quote`, { token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
