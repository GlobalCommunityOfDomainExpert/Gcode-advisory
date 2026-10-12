import { isResponse, json, limited, fail } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { NextDay } from "@/lib/booking/types";

/** The first three days (within 45) that have a slot: GET /api/booking/next?service=12 */
export async function GET(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const service = new URL(request.url).searchParams.get("service");
  if (!isNumericId(service)) return fail("Choose a service.");

  const blocked = limited([[`booking:read:${ctx.session.userId}`, 600, 10 * 60]]);
  if (blocked) return blocked;

  const res = await ords<NextDay[]>(`/services/${service}/next`, { token: ctx.session.token });
  return res.ok ? json({ days: res.data }) : relayError(res);
}
