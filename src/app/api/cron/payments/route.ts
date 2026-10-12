import { timingSafeEqual } from "node:crypto";
import { runPaymentJobs } from "@/lib/server/payments";

/**
 * For a scheduler: GET /api/cron/payments with  Authorization: Bearer <CRON_SECRET>, every few minutes.
 * Reconciles open orders with Cashfree, sends queued refunds, sends queued expert payouts. Safe to call as often as you like:
 * every step is idempotent (the order, refund and transfer ids never change).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const ok = !!secret && secret.length >= 16 && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) return new Response("Not found", { status: 404 });
  return Response.json(await runPaymentJobs());
}
