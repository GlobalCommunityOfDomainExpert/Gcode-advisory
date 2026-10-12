"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, CircleAlert, RotateCcw, ShieldCheck } from "lucide-react";
import { Button, ButtonLink, Icon, Spinner } from "@/components/atoms";
import { Banner } from "@/components/molecules";
import type { ReactNode } from "react";
import { fmtDay, fmtTime, rupees } from "@/lib/booking/time";
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
        This payment link isn’t valid. Open <Link className="underline" href="/bookings">My bookings</Link> to see your requests.
      </Banner>
    );
  }
  if (error) return <Banner tone="danger" icon={CircleAlert}>{error}</Banner>;

  if (!result) {
    return (
      <Panel glyph={<Spinner />} tone="neutral" title="Confirming your payment" description="Checking with the payment provider. This takes a few seconds." steps={1} />
    );
  }

  const { booking, payment } = result;
  const paid = payment === "PAID" || (booking.status !== "PENDING_PAYMENT" && booking.status !== "ABANDONED" && booking.paid);
  const summary = <OrderSummary booking={booking} />;

  if (paid) {
    return (
      <Panel
        glyph={<Icon icon={CheckCircle2} size="lg" />}
        tone="success"
        title="Payment received. Request sent."
        description={`${booking.expertName} has been asked to accept your session. Your ${rupees(booking.priceMinor)} is held until then.`}
        steps={3}
        summary={summary}
        footnote={
          <>
            <Icon icon={RotateCcw} size="sm" /> Declined or cancelled by either of you? Full refund to the account you paid from.
          </>
        }
      >
        <ButtonLink href="/bookings">View in My bookings</ButtonLink>
        <ButtonLink href={`/bookings/${booking.id}/receipt`} variant="outline">
          See receipt
        </ButtonLink>
      </Panel>
    );
  }

  if (payment === "FAILED" || payment === "EXPIRED" || booking.status === "ABANDONED") {
    return (
      <Panel
        glyph={<Icon icon={CircleAlert} size="lg" />}
        tone="danger"
        title={payment === "FAILED" ? "The payment didn’t go through" : "This payment window has closed"}
        description={`${payment === "FAILED" ? "You haven’t been charged." : "The time was released."} If money left your account, it comes back automatically.`}
        summary={summary}
      >
        <ButtonLink href={`/book/${booking.expertId}`}>Choose a time again</ButtonLink>
        <ButtonLink href="/bookings" variant="outline">
          My bookings
        </ButtonLink>
      </Panel>
    );
  }

  const slow = tries >= GIVE_UP_AFTER;
  return (
    <Panel
      glyph={slow ? <Icon icon={ShieldCheck} size="lg" /> : <Spinner />}
      tone={slow ? "warning" : "neutral"}
      title={slow ? "Your bank is still confirming" : "Waiting for your bank to confirm"}
      description={
        slow
          ? "It can take a few minutes. We’ll email you the moment it’s confirmed, and nothing is lost if you close this page."
          : "Keep this page open. We check again every few seconds, and a closed page never loses a payment."
      }
      steps={2}
      summary={summary}
    >
      {slow && (
        <>
          <ButtonLink href="/bookings">Go to My bookings</ButtonLink>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Check again
          </Button>
        </>
      )}
    </Panel>
  );
}

const TONES = {
  neutral: "bg-primary/10 text-primary",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  danger: "bg-danger-light text-danger",
} as const;

/** The three stages a payment goes through, so a person waiting can see where they are. */
function Steps({ at }: { at: 1 | 2 | 3 }) {
  const items = ["Payment sent", "Bank confirms", "Request sent"];
  return (
    <ol className="mx-auto mt-6 flex max-w-sm items-start justify-between" aria-label="Payment progress">
      {items.map((label, i) => {
        const n = i + 1;
        const done = n < at || at === 3;
        const now = n === at && at !== 3;
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center gap-2 text-center" aria-current={now ? "step" : undefined}>
            {i > 0 && <span aria-hidden="true" className={`absolute top-3.5 right-1/2 h-0.5 w-full ${n <= at ? "bg-success" : "bg-border-light"}`} />}
            <span
              className={`relative grid size-7 place-items-center rounded-full text-xs font-semibold ${done ? "bg-success text-white" : now ? "bg-primary text-white ring-4 ring-primary/15" : "bg-bg-subtle text-text-secondary ring-1 ring-border-light"}`}
            >
              {done ? <Check className="size-4" aria-hidden="true" /> : n}
            </span>
            <span className={`text-small ${now || done ? "text-text-primary" : "text-text-secondary"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderSummary({ booking }: { booking: BookingView }) {
  return (
    <div className="border-border-light bg-bg-subtle mt-6 rounded-md border p-4 text-left">
      <p className="text-body text-text-primary font-semibold">{booking.serviceTitle}</p>
      <p className="text-small text-text-secondary">
        with {booking.expertName} · {fmtDay(booking.startAt)}, {fmtTime(booking.startAt)} · {booking.durationMin} min
      </p>
      <p className="text-small text-text-primary mt-2 font-semibold">{rupees(booking.priceMinor)}</p>
    </div>
  );
}

/** One centred panel for every outcome, as in the wireframe's "Payment received" screen. */
function Panel({
  glyph,
  tone,
  title,
  description,
  steps,
  summary,
  footnote,
  children,
}: {
  glyph: ReactNode;
  tone: keyof typeof TONES;
  title: string;
  description: string;
  steps?: 1 | 2 | 3;
  summary?: ReactNode;
  footnote?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div role="status" className="bg-surface-light ring-primary/10 mx-auto max-w-xl rounded-lg p-8 text-center shadow-sm ring-1">
      <span className={`${TONES[tone]} mx-auto grid size-14 place-items-center rounded-full`}>{glyph}</span>
      <h1 className="text-heading text-text-primary mt-4 font-extrabold">{title}</h1>
      <p className="text-body text-text-secondary mx-auto mt-1 max-w-md">{description}</p>
      {steps && <Steps at={steps} />}
      {summary}
      {footnote && <p className="text-small text-text-secondary mt-3 flex items-center justify-center gap-2 text-left">{footnote}</p>}
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
