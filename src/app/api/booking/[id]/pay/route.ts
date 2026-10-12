import { checkOrigin, fail, isResponse, json, limited } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { startPayment } from "@/lib/server/payments";
import { requireProfile } from "@/lib/server/profile";

/**
 * Starts (or returns the still-open) payment order for a booking that is waiting for payment: POST /api/booking/42/pay.
 * With the Cashfree gateway the order is created here (the database never calls the gateway), then saved with the booking.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blockedOrigin = checkOrigin(request);
  if (blockedOrigin) return blockedOrigin;
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!isNumericId(id)) return fail("We couldn’t find that booking.", 404);

  const blocked = limited([[`booking:pay:${ctx.session.userId}`, 30, 10 * 60]]);
  if (blocked) return blocked;

  const res = await startPayment(ctx.session.token, id);
  return res.ok ? json(res.data) : relayError(res);
}
