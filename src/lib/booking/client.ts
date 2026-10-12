/** Browser side of the booking API. Talks only to our own /api/booking and /api/payments routes. */
import type { BookingAction, CallClockInfo, BookingRating, BookingView, DayCount, NextDay, PaymentOrder, ProblemReport, ReportType, Slot } from "./types";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  /** Safe, user-facing text. */
  error?: string;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, { credentials: "same-origin", cache: "no-store", ...init });
    const json = (await res.json().catch(() => null)) as ({ error?: string } & T) | null;
    if (!res.ok) {
      const fallback = res.status === 429 ? "Too many requests. Please wait a moment." : "Something went wrong. Please try again.";
      return { ok: false, status: res.status, error: json?.error ?? fallback };
    }
    return { ok: true, status: res.status, data: json as T };
  } catch {
    return { ok: false, status: 0, error: "Network problem. Check your connection and try again." };
  }
}

const post = (path: string, body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const getDays = (service: number, from: string, span: number, signal?: AbortSignal) =>
  call<{ days: DayCount[] }>(`/api/booking/days?service=${service}&from=${from}&span=${span}`, { signal });

export const getSlots = (service: number, day: string, signal?: AbortSignal) =>
  call<{ slots: Slot[] }>(`/api/booking/slots?service=${service}&day=${day}`, { signal });

export const getNext = (service: number, signal?: AbortSignal) => call<{ days: NextDay[] }>(`/api/booking/next?service=${service}`, { signal });

export const createBooking = (body: { serviceId: number; startAt: string; note: string }) => call<BookingView>("/api/booking", post("", body));

export const startPayment = (bookingId: number) => call<PaymentOrder>(`/api/booking/${bookingId}/pay`, post("", {}));

/** Test gateway only: pretend the customer paid ("SUCCESS") or that the payment was declined ("FAILURE"). */
export const confirmStubPayment = (orderId: string, outcome: "SUCCESS" | "FAILURE") =>
  call<BookingView>("/api/payments/stub-confirm", post("", { orderId, outcome }));

/** Accept needs no reason; decline and cancel take a code from the pick list and, for "Other", a note. */
export const actOnBooking = (id: number, action: BookingAction, reason?: { reason: string; note: string }) =>
  call<BookingView>(`/api/booking/${id}/${action}`, post("", reason ?? {}));

/** Suggest a new time for a confirmed session. The other person has to accept; the original time stands until then. */
export const proposeReschedule = (id: number, body: { startAt: string; reason: string; note: string }) => call<BookingView>(`/api/booking/${id}/reschedule`, post("", body));

/** Answer a suggested time: the other person accepts or declines; the person who suggested it can withdraw. */
export const answerReschedule = (id: number, verb: "accept" | "decline" | "withdraw") => call<BookingView>(`/api/booking/${id}/reschedule/${verb}`, post("", {}));

/** The booker rates a completed session: 1 to 5 stars and an optional comment. Once only. */
export const rateBooking = (id: number, body: { stars: number; comment: string }) => call<BookingRating>(`/api/booking/${id}/rate`, post("", body));

/** Either person reports a problem. Support decides; nothing is refunded before that. */
export const reportBooking = (id: number, body: { type: ReportType; note: string }) => call<ProblemReport>(`/api/booking/${id}/report`, post("", body));

/** The expert adds 15 minutes to the running session (free; twice at most). */
export const extendSession = (id: number) => call<CallClockInfo>(`/api/booking/${id}/extend`, post("", {}));

/** The session's current end and whether this person may extend it. Read-only. */
export const getCallClock = (slug: string) => call<CallClockInfo>(`/api/call/${slug}/clock`);
