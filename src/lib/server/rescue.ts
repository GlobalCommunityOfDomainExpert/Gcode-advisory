import { ords } from "@/lib/server/ords";
import type { BookingList, BookingView, RescueExpert, RescueOptions } from "@/lib/booking/types";

export interface RescueOffer {
  booking: BookingView;
  /** What this expert is offered for the paid session: their service and the times we suggest. */
  offer: { serviceId: number; slots: string[] };
  expiresAt: string;
}

/**
 * Does the signed-in person have a paid session an expert could not keep, and is `expertId` one of the experts offered for it (the
 * original one at a new time, or a same-price alternative)? Used by the expert's profile and the booking page so that picking the
 * same service there carries on with the paid session instead of starting a new booking that asks for payment.
 */
export async function findRescueOffer(token: string, expertId: string): Promise<RescueOffer | null> {
  const mine = await ords<BookingList>("/bookings/me?tab=upcoming&page_skip=0&page_len=20", { token });
  const booking = mine.ok ? mine.data.items.find((b) => b.role === "requester" && b.actions.includes("rescue")) : undefined;
  if (!booking) return null;
  const opts = await ords<RescueOptions>(`/bookings/${booking.id}/rescue`, { token });
  if (!opts.ok) return null;
  const o = opts.data;
  const offer: { serviceId: number; slots: string[] } | RescueExpert | undefined = o.sameExpert?.expertId === expertId ? o.sameExpert : o.others.find((x) => x.expertId === expertId);
  if (!offer || offer.slots.length === 0) return null;
  return { booking, offer: { serviceId: offer.serviceId, slots: offer.slots }, expiresAt: o.expiresAt };
}
