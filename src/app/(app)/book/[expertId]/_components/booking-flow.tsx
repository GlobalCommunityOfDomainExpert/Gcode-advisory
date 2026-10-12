"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, CreditCard, Lock, RotateCcw, Timer, UserCheck } from "lucide-react";
import { Avatar, Button, ButtonLink, Divider, Icon, SectionLabel, Spinner, Textarea } from "@/components/atoms";
import { Banner, FormField, StepIndicator } from "@/components/molecules";
import type { Step } from "@/components/molecules";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/ui";
import { openCashfreeCheckout } from "@/lib/booking/cashfree-checkout";
import { confirmStubPayment, createBooking, getDays, getNext, getSlots, startPayment, type ApiResult } from "@/lib/booking/client";
import { clock, dayKey, daysBetween, daysInMonth, fmtDay, fmtDayLong, fmtTime, istDay, parseDay, rupees, secondsLeft } from "@/lib/booking/time";
import type { BookingView, ExpertPage, PaymentOrder } from "@/lib/booking/types";
import { useLoaded } from "@/lib/booking/use-loaded";
import { Calendar } from "./calendar";

type StepName = "time" | "review" | "pay" | "done";

export function BookingFlow({ expert, initialServiceId }: { expert: ExpertPage; initialServiceId: number }) {
  const today = istDay();
  const start = parseDay(today);

  const [step, setStep] = useState<StepName>("time");
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [ym, setYm] = useState({ y: start.y, m: start.m });
  const [day, setDay] = useState<string | null>(null);
  const [slotAt, setSlotAt] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // bump to reload times after something changed under us
  const [now, setNow] = useState(() => Date.now());

  const service = expert.services.find((s) => s.id === serviceId) ?? expert.services[0];
  const paid = service.priceMinor > 0;

  // ---- data: which days are open this month, the quick-pick days, the times on the chosen day ----------------------
  const monthFirst = dayKey(ym.y, ym.m, 1);
  const monthLast = dayKey(ym.y, ym.m, daysInMonth(ym.y, ym.m));
  const daysRes = useLoaded<ApiResult<{ days: { day: string; count: number }[] }>>(`${service.id}|${monthFirst}|${tick}`, (signal) => {
    if (monthLast < today) return Promise.resolve({ ok: true, status: 200, data: { days: [] } });
    const from = monthFirst < today ? today : monthFirst;
    return getDays(service.id, from, Math.min(62, daysBetween(from, monthLast) + 1), signal);
  });
  const counts: Record<string, number> | null = daysRes ? Object.fromEntries((daysRes.data?.days ?? []).map((d) => [d.day, d.count])) : null;

  const nextRes = useLoaded(`${service.id}|${tick}`, (signal) => getNext(service.id, signal));
  const quick = nextRes?.data?.days ?? [];

  const slotsRes = useLoaded(day ? `${service.id}|${day}|${tick}` : null, (signal) => getSlots(service.id, day as string, signal));
  const slots = day && slotsRes ? (slotsRes.data?.slots ?? []) : null;

  // ---- the 15-minute hold on a paid booking ----------------------------------------------------------------------
  useEffect(() => {
    if (step !== "pay") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);
  const left = secondsLeft(booking?.expiresAt ?? null, now);
  const expired = step === "pay" && left === 0;

  // ---- start the payment as soon as we reach the pay step ----------------------------------------------------------
  const bookingId = booking?.id;
  useEffect(() => {
    if (step !== "pay" || !bookingId || order || payError) return;
    let cancelled = false;
    startPayment(bookingId).then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) setOrder(res.data);
      else setPayError(res.error ?? "We couldn’t start the payment.");
    });
    return () => {
      cancelled = true;
    };
  }, [step, bookingId, order, payError]);

  function pickService(id: number) {
    setServiceId(id);
    setDay(null);
    setSlotAt(null);
    setError(null);
  }

  function pickDay(d: string) {
    const p = parseDay(d);
    setYm({ y: p.y, m: p.m });
    setDay(d);
    setSlotAt(null);
    setError(null);
  }

  function restart(message?: string) {
    setBooking(null);
    setOrder(null);
    setPayError(null);
    setSlotAt(null);
    setStep("time");
    setError(message ?? null);
    setTick((t) => t + 1);
  }

  async function submit() {
    if (!slotAt || busy) return;
    setBusy(true);
    setError(null);
    const res = await createBooking({ serviceId: service.id, startAt: slotAt, note });
    setBusy(false);
    if (!res.ok || !res.data) {
      if (res.status === 409) restart(res.error ?? "That time is no longer available. Please choose another.");
      else setError(res.error ?? "We couldn’t create your booking.");
      return;
    }
    setBooking(res.data);
    setNow(Date.now());
    setStep(res.data.paymentRequired ? "pay" : "done");
  }

  async function pay(outcome: "SUCCESS" | "FAILURE") {
    if (!order || busy) return;
    setBusy(true);
    setError(null);
    const res = await confirmStubPayment(order.orderId, outcome);
    setBusy(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? "The payment didn’t go through.");
      return;
    }
    setBooking(res.data);
    if (outcome === "SUCCESS") {
      setStep("done");
    } else {
      setOrder(null); // a declined payment needs a fresh order
      setError("The payment was declined. You can try again.");
    }
  }

  // Cashfree: leave for the hosted checkout. We come back at /book/return, which asks the server what really happened.
  async function payCashfree() {
    if (!order?.paymentSessionId || busy) return;
    setBusy(true);
    setError(null);
    const message = await openCashfreeCheckout(order.paymentSessionId, order.checkoutMode ?? "production");
    if (message) {
      setBusy(false);
      setError(message);
    }
  }

  const labels = paid ? ["Choose time", "Review", "Pay", "Request sent"] : ["Choose time", "Review", "Request sent"];
  const current = step === "time" ? 0 : step === "review" ? 1 : step === "pay" ? 2 : labels.length - 1;
  const steps: Step[] = labels.map((label, i) => ({
    label,
    status: step === "done" || i < current ? "completed" : i === current ? "current" : "upcoming",
  }));

  const when = slotAt ? `${fmtDay(slotAt)} · ${fmtTime(slotAt)}` : null;
  const first = expert.name.split(" ")[0];

  return (
    <div className="space-y-8 pb-8">
      <div className="max-w-xl">
        <StepIndicator steps={steps} />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="bg-surface-light min-w-0 space-y-6 rounded-lg p-6 shadow-sm ring-1 ring-primary/10 sm:p-8">
          {error && <Banner tone="danger">{error}</Banner>}

          {step === "time" && (
            <div className="space-y-8">
              <section>
                <SectionLabel className="mb-3">1 · Service</SectionLabel>
                <div role="radiogroup" aria-label="Service" className="space-y-2">
                  {expert.services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={s.id === service.id}
                      onClick={() => pickService(s.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-4 rounded-md border-2 p-4 text-left transition-colors",
                        focusRing,
                        s.id === service.id ? "border-primary bg-primary-light" : "border-border-light bg-surface-light hover:border-border-hover",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="text-body text-text-primary block font-semibold">{s.title}</span>
                        <span className="text-small text-text-secondary">
                          {s.durationMin} min{s.bufferMin ? ` · ${s.bufferMin} min buffer between sessions` : ""}
                        </span>
                      </span>
                      <span className={cn("text-body shrink-0 font-bold", s.priceMinor === 0 ? "text-success" : "text-text-primary")}>{rupees(s.priceMinor)}</span>
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid gap-x-10 gap-y-8 md:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
                <section>
                  <SectionLabel className="mb-3">2 · Date</SectionLabel>
                  <Calendar y={ym.y} m={ym.m} today={today} counts={counts} selected={day} onPick={pickDay} onMonth={(y, m) => setYm({ y, m })} />
                  {daysRes && !daysRes.ok && <p className="text-small text-danger mt-3">{daysRes.error}</p>}
                </section>

                <section>
                  <SectionLabel className="mb-3">3 · Time</SectionLabel>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-small text-text-secondary">Next available:</span>
                    {nextRes === null ? (
                      <span className="text-small text-text-secondary">looking…</span>
                    ) : quick.length === 0 ? (
                      <span className="text-small text-text-secondary">nothing in the next 45 days</span>
                    ) : (
                      quick.map((q) => (
                        <button
                          key={q.day}
                          type="button"
                          onClick={() => pickDay(q.day)}
                          className={cn("text-small border-border-light bg-surface-light hover:bg-bg-light rounded-full border px-3 py-1 font-medium", focusRing)}
                        >
                          {fmtDay(q.day)}
                        </button>
                      ))
                    )}
                  </div>

                  {!day ? (
                    <p className="text-small text-text-secondary">Pick a date to see the available times.</p>
                  ) : slots === null ? (
                    <div className="text-small text-text-secondary flex items-center gap-2">
                      <Spinner /> Loading times…
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-small text-text-secondary">No times left on {fmtDayLong(day)}. Try another date.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {slots.map((s) => (
                          <button
                            key={s.startAt}
                            type="button"
                            aria-pressed={s.startAt === slotAt}
                            onClick={() => setSlotAt(s.startAt)}
                            className={cn(
                              "text-small rounded-sm border px-3 py-2.5 font-semibold transition-colors",
                              focusRing,
                              s.startAt === slotAt ? "border-primary bg-primary text-white" : "border-border-hover bg-surface-light text-text-primary hover:border-primary",
                            )}
                          >
                            {fmtTime(s.startAt)}
                          </button>
                        ))}
                      </div>
                      <p className="text-small text-text-secondary mt-3">Times are shown in India Standard Time (IST).</p>
                    </>
                  )}
                </section>
              </div>

              <Button className="w-full sm:w-auto" disabled={!slotAt} onClick={() => setStep("review")}>
                Continue <Icon icon={ArrowRight} size="sm" />
              </Button>
            </div>
          )}

          {step === "review" && slotAt && (
            <div className="space-y-6">
              <div>
                <SectionLabel className="mb-3">Your booking</SectionLabel>
                <div className="border-border-light bg-bg-subtle rounded-md border p-4">
                  <p className="text-body text-text-primary font-semibold">{service.title}</p>
                  <p className="text-small text-text-secondary">
                    {fmtDayLong(slotAt)} · {fmtTime(slotAt)} · {service.durationMin} min with {expert.name}
                  </p>
                </div>
              </div>
              <FormField label="What would you like to discuss?" htmlFor="bk-note" required hint="A few sentences help the expert decide and prepare (at least 10 characters).">
                <Textarea
                  id="bk-note"
                  rows={4}
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. I’m planning my go-to-market for a B2B invoicing product and want feedback on pricing."
                />
              </FormField>
              <Banner tone="info">
                {paid
                  ? `You pay ${rupees(service.priceMinor)} next to send this request. The money is held safely until the expert accepts. If the request is declined, or either of you cancels, you get a full refund within 7 days.`
                  : "This is a free session. The expert will accept or decline, and you’ll be told either way."}
              </Banner>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" onClick={() => setStep("time")}>
                  <Icon icon={ArrowLeft} size="sm" /> Back
                </Button>
                <Button loading={busy} disabled={note.trim().length < 10} onClick={submit}>
                  {paid ? "Continue to payment" : "Send request"} <Icon icon={ArrowRight} size="sm" />
                </Button>
              </div>
            </div>
          )}

          {step === "pay" && booking && (
            <div className="space-y-6">
              <div>
                <h2 className="text-heading text-text-primary font-extrabold">Pay to send your request</h2>
                <p className="text-body text-text-secondary mt-1">
                  {rupees(booking.priceMinor)} is held securely until {first} accepts. Declined or cancelled? Full refund within 7 days.
                </p>
              </div>

              {expired ? (
                <Banner tone="danger" icon={Timer}>
                  <span className="flex flex-wrap items-center justify-between gap-3">
                    <span>Your 15 minutes are up and the time was released.</span>
                    <Button size="sm" variant="secondary" onClick={() => restart()}>
                      Choose another time
                    </Button>
                  </span>
                </Banner>
              ) : (
                <Banner tone="warning" icon={Timer}>
                  We’re holding this time for you for <b className="tabular-nums">{clock(left)}</b>. Pay before then or it goes back to other people.
                </Banner>
              )}

              {!expired && (
                <div className="space-y-4">
                  {payError ? (
                    <Banner tone="danger">
                      <span className="flex flex-wrap items-center justify-between gap-3">
                        <span>{payError}</span>
                        <Button size="sm" variant="secondary" onClick={() => setPayError(null)}>
                          Try again
                        </Button>
                      </span>
                    </Banner>
                  ) : !order ? (
                    <div className="text-small text-text-secondary flex items-center gap-2">
                      <Spinner /> Preparing your payment…
                    </div>
                  ) : (
                    <>
                      {order.gateway === "STUB" && (
                        <Banner tone="info" icon={CreditCard}>
                          <b>Test payment.</b> This is a stand-in for the real checkout: no money moves.
                        </Banner>
                      )}
                      {order.gateway === "CASHFREE" && order.checkoutMode === "sandbox" && (
                        <Banner tone="info" icon={CreditCard}>
                          <b>Test mode.</b> You will go to Cashfree&apos;s test checkout. Use a test card or the test UPI id shown there: no real money moves.
                        </Banner>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        <Button loading={busy} onClick={() => (order.gateway === "CASHFREE" ? payCashfree() : pay("SUCCESS"))}>
                          Pay {rupees(order.amountMinor)} &amp; send request
                        </Button>
                        {order.gateway === "STUB" && (
                          <Button variant="secondary" disabled={busy} onClick={() => pay("FAILURE")}>
                            Simulate a declined payment
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                  <p className="text-small text-text-secondary flex items-center gap-2">
                    <Icon icon={Lock} size="sm" />
                    Card and bank details are entered on the payment provider’s own page. GCODE never sees them.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === "done" && booking && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <span className="bg-success-light text-success grid size-14 shrink-0 place-items-center rounded-full">
                  <Icon icon={CheckCircle2} size="lg" />
                </span>
                <div>
                  <h2 className="text-heading text-text-primary font-extrabold">Request sent to {first}</h2>
                  <p className="text-body text-text-secondary mt-1">
                    {fmtDayLong(booking.startAt)} · {fmtTime(booking.startAt)} · {booking.durationMin} min
                    {booking.priceMinor > 0 ? ` · ${rupees(booking.priceMinor)} paid` : ""}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-body text-text-primary mb-3 font-semibold">What happens next</p>
                <ol className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Icon icon={UserCheck} size="md" className="text-primary mt-0.5" />
                    <div>
                      <p className="text-body text-text-primary font-semibold">{expert.name} accepts or declines</p>
                      <p className="text-small text-text-secondary">They have 24 hours. You’re told either way.</p>
                    </div>
                  </li>
                  {booking.priceMinor > 0 && (
                    <li className="flex items-start gap-3">
                      <Icon icon={RotateCcw} size="md" className="text-primary mt-0.5" />
                      <div>
                        <p className="text-body text-text-primary font-semibold">{rupees(booking.priceMinor)} is held securely</p>
                        <p className="text-small text-text-secondary">It’s released to the expert only after the session. If nobody answers, or it’s declined, you get a full refund.</p>
                      </div>
                    </li>
                  )}
                  <li className="flex items-start gap-3">
                    <Icon icon={CalendarClock} size="md" className="text-primary mt-0.5" />
                    <div>
                      <p className="text-body text-text-primary font-semibold">Need a different time?</p>
                      <p className="text-small text-text-secondary">Either of you can propose a new time from My bookings — the other has to accept.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon icon={CalendarClock} size="md" className="text-primary mt-0.5" />
                    <div>
                      <p className="text-body text-text-primary font-semibold">Track it in My bookings</p>
                      <p className="text-small text-text-secondary">The status updates there as things move.</p>
                    </div>
                  </li>
                </ol>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href="/bookings">View my bookings</ButtonLink>
                <ButtonLink href="/directory" variant="secondary">
                  Back to directory
                </ButtonLink>
              </div>
            </div>
          )}
        </div>

        <aside className="bg-surface-light rounded-lg p-6 shadow-sm ring-1 ring-primary/10 lg:sticky lg:top-6">
          <div className="flex items-center gap-3">
            <Avatar src={expert.photoUrl ?? undefined} alt={expert.name} size="lg" />
            <div className="min-w-0">
              <p className="text-body text-text-primary truncate font-semibold">{expert.name}</p>
              {expert.headline && <p className="text-small text-text-secondary truncate">{expert.headline}</p>}
            </div>
          </div>
          <Divider className="my-5" />
          <dl className="text-small space-y-3">
            <Row label="Service" value={service.title} />
            <Row label="Length" value={`${service.durationMin} min`} />
            <Row label="When" value={when ?? "Pick a date and time"} muted={!when} />
            <Row label="Timezone" value="India (IST)" />
          </dl>
          <Divider className="my-5" />
          <div className="flex items-center justify-between">
            <span className="text-body text-text-primary font-semibold">Price</span>
            <span className={cn("text-large font-bold", paid ? "text-text-primary" : "text-success")}>{rupees(service.priceMinor)}</span>
          </div>
          <p className="text-small text-text-secondary mt-2">
            {paid ? "You pay when you send the request. It’s held until the expert accepts." : "Free session: no payment needed."}
          </p>
          {step === "pay" && !expired && (
            <p className="text-small text-warning mt-3 flex items-center gap-2 font-medium">
              <Icon icon={Timer} size="sm" />
              Held for you: <span className="tabular-nums">{clock(left)}</span>
            </p>
          )}
          <p className="text-small text-text-secondary mt-4">
            <Link href="/directory" className="text-primary font-bold underline underline-offset-2">
              Back to directory
            </Link>
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-secondary">{label}</dt>
      <dd className={cn("text-right", muted ? "text-text-secondary" : "text-text-primary font-medium")}>{value}</dd>
    </div>
  );
}
