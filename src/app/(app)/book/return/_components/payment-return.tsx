"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Hourglass } from "lucide-react";
import { Button, ButtonLink, Icon, Spinner } from "@/components/atoms";
import { Banner } from "@/components/molecules";
import { fmtTime, rupees } from "@/lib/booking/time";
import type { BookingView } from "@/lib/booking/types";

type Verdict = "PAID" | "FAILED" | "PENDING" | "EXPIRED" | "ERROR";
interface Verified {
  booking: BookingView;
  payment: Verdict;
}

const POLL_MS = 3000;
const GIVE_UP_AFTER = 10; // tries: about 30 seconds, then we tell them it can take a few minutes and they will be emailed

/**
 * Asks the server (which asks Cashfree) what happened, every few seconds while it is still pending. The money is settled by the
 * server and the webhook, so closing this page never loses a payment.
 */
export function PaymentReturn({ orderId }: { orderId: string | null }) {
  const [result, setResult] = useState<Verified | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    async function check(n: number) {
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.error ?? "We couldn’t check your payment. Please refresh the page.");
          return;
        }
        setResult(json as Verified);
        setTries(n + 1);
        const v = (json as Verified).payment;
        if ((v === "PENDING" || v === "ERROR") && n + 1 < GIVE_UP_AFTER) timer.current = setTimeout(() => check(n + 1), POLL_MS);
      } catch {
        if (!cancelled) setError("Network problem. Check your connection and refresh the page.");
      }
    }
    void check(0);
    return () => {
      cancelled = true;
      clearTimeout(timer.current);
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <Banner tone="danger" icon={CircleAlert}>
        This payment link isn’t valid. Open <a className="underline" href="/bookings">My bookings</a> to see your requests.
      </Banner>
    );
  }
  if (error) return <Banner tone="danger" icon={CircleAlert}>{error}</Banner>;
  if (!result) {
    return (
      <div className="text-body text-text-secondary flex items-center gap-3 py-6">
        <Spinner /> Checking with the payment provider…
      </div>
    );
  }

  const { booking, payment } = result;
  const paid = payment === "PAID" || (booking.status !== "PENDING_PAYMENT" && booking.status !== "ABANDONED" && booking.paid);

  if (paid) {
    return (
      <div className="max-w-xl space-y-5">
        <div className="flex items-start gap-4">
          <span className="bg-success-light text-success grid size-14 shrink-0 place-items-center rounded-full">
            <Icon icon={CheckCircle2} size="lg" />
          </span>
          <div>
            <h2 className="text-heading text-text-primary font-extrabold">Payment received. Request sent.</h2>
            <p className="text-body text-text-secondary mt-1">
              {rupees(booking.priceMinor)} for {booking.serviceTitle} with {booking.expertName} on {fmtTime(booking.startAt)}. The money is held safely until they accept. If they decline, or either of you cancels, you get a full refund.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/bookings">Go to My bookings</ButtonLink>
          <ButtonLink href={`/bookings/${booking.id}/receipt`} variant="outline">
            See receipt
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (payment === "FAILED" || payment === "EXPIRED" || booking.status === "ABANDONED") {
    return (
      <div className="max-w-xl space-y-5">
        <Banner tone="danger" icon={CircleAlert}>
          {payment === "FAILED" ? "The payment didn’t go through, and you haven’t been charged." : "This payment window has closed and the time was released."} If money left your account, it comes back automatically.
        </Banner>
        <ButtonLink href={`/book/${booking.expertId}`}>Choose a time again</ButtonLink>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      <Banner tone="warning" icon={Hourglass}>
        {tries >= GIVE_UP_AFTER
          ? "Your bank is still confirming this payment. It can take a few minutes. We’ll email you the moment it’s confirmed, and nothing is lost if you close this page."
          : "Waiting for your bank to confirm the payment…"}
      </Banner>
      {tries >= GIVE_UP_AFTER && (
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/bookings">Go to My bookings</ButtonLink>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Check again
          </Button>
        </div>
      )}
    </div>
  );
}
