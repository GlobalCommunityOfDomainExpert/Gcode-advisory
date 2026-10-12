import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { BookingRating } from "@/lib/booking/types";

/**
 * Rate a completed session: POST /api/booking/42/rate { stars: 1-5, comment? }.
 * The rules (only the booker, only a completed session, once) are the backend's; this only checks the shape.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!isNumericId(id)) return fail("We couldn’t find that booking.", 404);

  const body = await readJson(request, 2 * 1024);
  if (isResponse(body)) return body;
  const blocked = limited([[`booking:rate:${ctx.session.userId}`, 30, 10 * 60]]);
  if (blocked) return blocked;

  const stars = body.stars;
  if (typeof stars !== "number" || !Number.isInteger(stars) || stars < 1 || stars > 5) return fail("Choose 1 to 5 stars.");
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  if (comment.length > 500) return fail("The comment is too long (500 characters at most).");

  const res = await ords<BookingRating>(`/bookings/${id}/rate`, { method: "POST", body: { stars, comment }, token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
