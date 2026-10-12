import { isResponse, json, limited, fail } from "@/lib/server/guard";
import { isDay, isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { DayCount } from "@/lib/booking/types";

/** How many open slots each day has, for greying out the calendar: GET /api/booking/days?service=12&from=2026-10-01&span=31 */
export async function GET(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const q = new URL(request.url).searchParams;
  const service = q.get("service");
  const from = q.get("from");
  const span = Number(q.get("span") ?? "31");
  if (!isNumericId(service) || !isDay(from) || !Number.isInteger(span) || span < 1 || span > 62) return fail("Choose a service and a month.");

  const blocked = limited([[`booking:read:${ctx.session.userId}`, 600, 10 * 60]]);
  if (blocked) return blocked;

  const res = await ords<DayCount[]>(`/services/${service}/days?from_day=${from}&span_days=${span}`, { token: ctx.session.token });
  return res.ok ? json({ days: res.data }) : relayError(res);
}
