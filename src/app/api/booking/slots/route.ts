import { isResponse, json, limited, fail } from "@/lib/server/guard";
import { isDay, isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { Slot } from "@/lib/booking/types";

/** Open times for one service on one day: GET /api/booking/slots?service=12&day=2026-10-20 */
export async function GET(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const q = new URL(request.url).searchParams;
  const service = q.get("service");
  const day = q.get("day");
  if (!isNumericId(service) || !isDay(day)) return fail("Choose a service and a day.");

  const blocked = limited([[`booking:read:${ctx.session.userId}`, 600, 10 * 60]]);
  if (blocked) return blocked;

  const res = await ords<Slot[]>(`/services/${service}/slots?on_day=${day}`, { token: ctx.session.token });
  return res.ok ? json({ slots: res.data }) : relayError(res);
}
