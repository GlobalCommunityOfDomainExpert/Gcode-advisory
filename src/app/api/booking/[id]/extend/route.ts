import { fail, isResponse, json, limited } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { CallClockInfo } from "@/lib/booking/types";

/** The expert gives a running session 15 more minutes: POST /api/booking/42/extend. The database decides who, when and how often. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!isNumericId(id)) return fail("We couldn’t find that booking.", 404);
  const blocked = limited([[`booking:extend:${ctx.session.userId}`, 10, 10 * 60]]);
  if (blocked) return blocked;
  const res = await ords<CallClockInfo>(`/bookings/${id}/extend`, { method: "POST", body: {}, token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
