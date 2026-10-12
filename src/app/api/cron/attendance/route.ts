import { timingSafeEqual } from "node:crypto";
import { pendingAttendance, syncAttendance } from "@/lib/server/attendance";

/**
 * For a scheduler (OCI, cron, a platform cron): GET /api/cron/attendance with  Authorization: Bearer <CRON_SECRET>.
 * Pulls the video vendor's report for sessions that ended and hands it to the database. At most 20 per call and one at a
 * time, so it stays gentle on the vendor's limits. Safe to call as often as every few minutes.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const ok = !!secret && secret.length >= 16 && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return new Response("Not found", { status: 404 });

  const pending = await pendingAttendance();
  if (!pending) return Response.json({ error: "backend unavailable" }, { status: 502 });
  let delivered = 0;
  for (const p of pending.slice(0, 20)) {
    if (await syncAttendance(p.bookingId, p.room)) delivered += 1;
  }
  return Response.json({ pending: pending.length, delivered });
}
