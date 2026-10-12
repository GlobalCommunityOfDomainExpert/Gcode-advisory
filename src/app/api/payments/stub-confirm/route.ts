import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { BookingView } from "@/lib/booking/types";

/**
 * TEST GATEWAY ONLY: stands in for "the customer paid (or didn't) on the hosted checkout". The backend refuses it
 * unless the database has PAYMENT_GATEWAY = STUB, so in production this route answers 409 and moves no money.
 * Replaced by the real Cashfree return and webhook in Sprint 4.
 */
export async function POST(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const body = await readJson(request, 1024);
  if (isResponse(body)) return body;

  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const outcome = body.outcome === "FAILURE" ? "FAILURE" : body.outcome === "SUCCESS" ? "SUCCESS" : "";
  if (!/^STUB_[a-f0-9]{32}$/.test(orderId) || !outcome) return fail("That payment couldn’t be found.");

  const blocked = limited([[`booking:pay:${ctx.session.userId}`, 30, 10 * 60]]);
  if (blocked) return blocked;

  const res = await ords<BookingView>(`/payments/${orderId}/stub-confirm`, { body: { outcome }, token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
