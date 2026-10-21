import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { BookingView } from "@/lib/booking/types";

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/** POST /api/booking/42/rescue/rebook { serviceId, startAt }: keep the paid session with that expert at that time. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!isNumericId(id)) return fail("We couldn’t find that booking.", 404);
  const body = await readJson(request, 1024);
  if (isResponse(body)) return body;
  const serviceId = typeof body.serviceId === "number" ? body.serviceId : NaN;
  const startAt = typeof body.startAt === "string" ? body.startAt : "";
  if (!Number.isInteger(serviceId) || serviceId <= 0 || !ISO.test(startAt)) return fail("Choose one of the times shown.");
  const blocked = limited([[`booking:rescue:${ctx.session.userId}`, 60, 10 * 60]]);
  if (blocked) return blocked;
  const res = await ords<BookingView>(`/bookings/${id}/rescue/rebook`, { method: "POST", body: { serviceId, startAt }, token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
