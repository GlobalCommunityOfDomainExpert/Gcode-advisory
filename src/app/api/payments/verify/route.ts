import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { relayError } from "@/lib/server/booking";
import { cashfree } from "@/lib/server/cashfree";
import { ords } from "@/lib/server/ords";
import { bookingOfOrder, verifyOrder } from "@/lib/server/payments";
import { requireProfile } from "@/lib/server/profile";
import type { BookingView } from "@/lib/booking/types";

/**
 * The return page after the hosted checkout: POST /api/payments/verify { orderId }. The browser's word is NOT taken for
 * anything. We read the booking as the signed-in person (a stranger's order is a 404), ask Cashfree what really happened,
 * tell the database, and answer with the booking as it now stands plus what the gateway said.
 */
export async function POST(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const body = await readJson(request, 1024);
  if (isResponse(body)) return body;

  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const bookingId = bookingOfOrder(orderId);
  if (!bookingId) return fail("That payment couldn’t be found.", 404);

  const blocked = limited([[`booking:verify:${ctx.session.userId}`, 60, 10 * 60]]);
  if (blocked) return blocked;

  const mine = await ords<BookingView>(`/bookings/${bookingId}`, { token: ctx.session.token });
  if (!mine.ok) return relayError(mine);
  if (mine.data.role !== "requester") return fail("That payment couldn’t be found.", 404);

  const cf = cashfree();
  const payment = cf ? await verifyOrder(orderId, cf) : "ERROR";
  const fresh = await ords<BookingView>(`/bookings/${bookingId}`, { token: ctx.session.token });
  return fresh.ok ? json({ booking: fresh.data, payment }) : relayError(fresh);
}
