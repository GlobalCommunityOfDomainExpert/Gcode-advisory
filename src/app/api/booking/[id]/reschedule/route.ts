import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { BookingView } from "@/lib/booking/types";

/**
 * Suggest a new time for a confirmed session: POST /api/booking/42/reschedule { startAt, reason, note? }.
 * Either person may. The other person answers (accept, decline) and the original time stands until they accept.
 * Whether the time is really on offer is the backend's check; this only checks the shape.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!isNumericId(id)) return fail("We couldn’t find that booking.", 404);

  const body = await readJson(request, 2 * 1024);
  if (isResponse(body)) return body;
  const blocked = limited([[`booking:reschedule:${ctx.session.userId}`, 30, 10 * 60]]);
  if (blocked) return blocked;

  const startAt = typeof body.startAt === "string" ? body.startAt.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(startAt) || Number.isNaN(Date.parse(startAt))) return fail("Choose a new time.");
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!/^[A-Z_]{3,40}$/.test(reason)) return fail("Choose a reason.");
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length > 500) return fail("The note is too long (500 characters at most).");

  const res = await ords<BookingView>(`/bookings/${id}/reschedule`, { method: "POST", body: { startAt, reason, note }, token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
