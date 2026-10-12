import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { isInstant, isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { BookingView } from "@/lib/booking/types";

/** Creates a booking: POST /api/booking { serviceId, startAt, note }. Paid ones come back PENDING_PAYMENT with a 15-minute hold. */
export async function POST(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const body = await readJson(request, 4 * 1024);
  if (isResponse(body)) return body;

  const serviceId = String(body.serviceId ?? "");
  const startAt = body.startAt;
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!isNumericId(serviceId) || !isInstant(startAt)) return fail("Choose a service and a time.");
  if (note.length < 10) return fail("Write at least 10 characters to the expert.");
  if (note.length > 1000) return fail("Your message is too long (1000 characters at most).");

  const blocked = limited([[`booking:create:${ctx.session.userId}`, 20, 10 * 60]]);
  if (blocked) return blocked;

  // The caller's id comes from the session token the backend verifies; it is never sent in the body.
  const res = await ords<BookingView>("/bookings/", {
    body: { serviceId: Number(serviceId), startAt, note },
    token: ctx.session.token,
  });
  return res.ok ? json(res.data, 201) : relayError(res);
}
