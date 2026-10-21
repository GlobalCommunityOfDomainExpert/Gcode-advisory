import { fail, isResponse, json } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { RescueOptions } from "@/lib/booking/types";

/**
 * GET /api/booking/42/rescue: what the booker can pick instead of a refund (another time with the same expert, or another
 * expert at exactly the same price). Only the booker, only while the choice is open. Read-only.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!isNumericId(id)) return fail("We couldn’t find that booking.", 404);
  const res = await ords<RescueOptions>(`/bookings/${id}/rescue`, { token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
