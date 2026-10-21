import type { BadgeTone } from "@/components/atoms/badge";
import { STATUS_LABEL, type BookingStatus, type BookingView } from "./types";

/** The badge colour of each booking status (My bookings and the dashboard share it). */
export const STATUS_TONE: Record<BookingStatus, BadgeTone> = {
  PENDING_PAYMENT: "warning",
  PENDING: "warning",
  SCHEDULED: "success",
  COMPLETED: "neutral",
  CANCELLED: "danger",
  DECLINED: "danger",
  EXPIRED: "warning",
  ABANDONED: "neutral",
};

/** The status as the viewer should read it. A waiting new time reads "Reschedule requested" (you were asked) or "Reschedule sent". */
export function statusText(b: BookingView): string {
  if (b.reschedule) return b.reschedule.byMe ? "Reschedule sent" : "Reschedule requested";
  if (b.rescue && b.role === "requester") return "Payment safe";
  if (b.status === "PENDING") return b.role === "expert" ? "Needs your answer" : "Waiting for the expert";
  if (b.status === "COMPLETED" && b.outcome) {
    const mine = b.role === "expert" ? "EXPERT" : "REQUESTER";
    if (b.outcome === "BOTH_NO_SHOW") return "Nobody joined";
    if (b.outcome === `${mine}_NO_SHOW`) return "You didn’t join";
    if (b.outcome.endsWith("_NO_SHOW")) return b.role === "expert" ? "Booker didn’t join" : "Expert didn’t join";
  }
  if (b.status === "CANCELLED") return b.cancelledBy === "EXPERT" ? "Cancelled by expert" : b.cancelledBy === "REQUESTER" ? "Cancelled by booker" : "Cancelled";
  return STATUS_LABEL[b.status];
}
