"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Check } from "lucide-react";
import { Avatar, Badge, Button, ButtonLink, Icon, SectionLabel, Textarea } from "@/components/atoms";
import type { BadgeTone } from "@/components/atoms";
import { Banner, Modal } from "@/components/molecules";
import { Stars } from "@/components/domain";
import { Toast } from "@/components/layout";
import { RateDialog, ReportDialog } from "./feedback-dialogs";
import { RescheduleDialog } from "./reschedule-dialog";
import { actOnBooking, answerReschedule } from "@/lib/booking/client";
import { dateColumn, fmtDay, fmtTime, isToday, rupees } from "@/lib/booking/time";
import { statusText, STATUS_TONE } from "@/lib/booking/status";
import type { BookingAction, BookingReason, BookingStatus, BookingView } from "@/lib/booking/types";

/** The stripe on the card's left edge: amber needs a step, green is confirmed, red is declined or cancelled. */
const STRIPE: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "border-l-warning",
  PENDING: "border-l-warning",
  SCHEDULED: "border-l-success",
  COMPLETED: "border-l-border-hover",
  CANCELLED: "border-l-danger",
  DECLINED: "border-l-danger",
  EXPIRED: "border-l-border-hover",
  ABANDONED: "border-l-border-hover",
};

/** "Fri, 16 Oct · 10:00 am". */
const slotText = (iso: string) => `${fmtDay(iso)} · ${fmtTime(iso)}`;

/** The wireframe's detail line under the title while a new time waits, so the money and the original time are never in doubt. */
function proposalDetail(b: BookingView, first: string): string {
  const money = b.role === "requester" ? (b.paid ? `${rupees(b.priceMinor)} paid · ` : "") : b.priceMinor > 0 ? `Paid ${rupees(b.priceMinor)} · ` : "";
  const text = b.reschedule?.byMe ? `your original time stands until ${first} accepts` : b.priceMinor > 0 ? "held until the session is done" : "your original time stands until you answer";
  return money + (money ? text : text.charAt(0).toUpperCase() + text.slice(1));
}

interface Pending {
  booking: BookingView;
  action: "decline" | "cancel";
}

export function BookingList({ items, reasons, grouped = false }: { items: BookingView[]; reasons: BookingReason[]; grouped?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<BookingView | null>(null);
  const [reporting, setReporting] = useState<BookingView | null>(null);
  const [rescheduling, setRescheduling] = useState<BookingView | null>(null);
  const [notice, setNotice] = useState<{ message: string; tone: "success" | "info" } | null>(null);

  const options = pending
    ? reasons.filter((r) => r.action === pending.action && r.actor === (pending.booking.role === "expert" ? "expert" : "requester"))
    : [];
  const chosen = options.find((r) => r.code === code);
  const noteTooShort = !!chosen?.needsNote && note.trim().length < 5;

  function close() {
    setPending(null);
    setCode("");
    setNote("");
    setError(null);
  }

  async function run(b: BookingView, action: BookingAction, reason?: { reason: string; note: string }) {
    setBusy(b.id);
    setError(null);
    const res = await actOnBooking(b.id, action, reason);
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      // The booking may have changed under us (expired, or cancelled by the other person): show what is true now.
      if (res.status === 409 || res.status === 404) router.refresh();
      return false;
    }
    router.refresh();
    return true;
  }

  /** Accept, decline or withdraw a suggested new time. The toast says what happened, as in the wireframe. */
  async function answer(b: BookingView, verb: "accept" | "decline" | "withdraw") {
    const first = who(b).split(" ")[0];
    setBusy(b.id);
    setError(null);
    const res = await answerReschedule(b.id, verb);
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      router.refresh(); // someone may have answered, or the time may have been taken: show what is true now
      return;
    }
    if (verb === "accept") {
      const d = dateColumn(res.data?.startAt ?? b.reschedule?.startAt ?? b.startAt);
      setNotice({ message: `New time accepted: ${d.month} ${d.day}. ${first} is notified.`, tone: "success" });
    } else if (verb === "decline") {
      setNotice({ message: "New time declined. The original time stands.", tone: "info" });
    } else {
      setNotice({ message: "Reschedule request withdrawn. The original time stands.", tone: "info" });
    }
    router.refresh();
  }

  async function submit() {
    if (!pending || !chosen || noteTooShort) return;
    if (await run(pending.booking, pending.action, { reason: chosen.code, note: note.trim() })) close();
  }

  // for an expert: requests to answer and new times to answer (the wireframe's "Needs your response")
  const needs = items.filter((b) => b.role === "expert" && (b.status === "PENDING" || (!!b.reschedule && !b.reschedule.byMe)));
  const rest = items.filter((b) => !needs.includes(b));
  const who = (b: BookingView) => (b.role === "requester" ? b.expertName : b.requesterName);

  /** One agenda entry: date column with the timeline line, then a status-striped card. */
  const row = (b: BookingView) => {
    const d = dateColumn(b.startAt);
    const first = who(b).split(" ")[0];
    const tone: BadgeTone = b.reschedule ? "warning" : STATUS_TONE[b.status];
    const stripe = b.reschedule ? "border-l-warning" : STRIPE[b.status];
    return (
      <div key={b.id} className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-5 [&:last-child_.tl-line]:hidden">
        <div className="flex flex-col items-center pt-1 text-center">
          <span className="text-small text-text-secondary font-semibold uppercase">{d.weekday}</span>
          <span className="text-heading text-text-primary leading-none font-extrabold">{d.day}</span>
          <span className="text-small text-text-secondary uppercase">{d.month}</span>
          <span className="tl-line bg-border-hover mt-3 w-px flex-1" />
        </div>
        <div className={`bg-surface-light ${stripe} ring-primary/10 mb-5 rounded-lg border-l-4 p-5 shadow-sm ring-1`}>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
            <div className="flex min-w-0 flex-1 basis-60 items-start gap-3.5">
              <Avatar alt={who(b)} sizeClassName="size-11" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="text-body text-text-primary font-semibold">{b.serviceTitle}</h3>
                  <Badge tone={tone}>{statusText(b)}</Badge>
                </div>
                <p className="text-small text-text-secondary mt-1">
                  {b.role === "requester" ? "with" : "requested by"} <span className="text-text-primary font-medium">{who(b)}</span> · {fmtTime(b.startAt)} · {b.durationMin} min · {rupees(b.priceMinor)}
                </p>
                {b.note && <p className="text-small text-text-secondary line-clamp-2">“{b.note}”</p>}
                {b.reasonLabel && (
                  <p className="text-small text-text-secondary mt-1">
                    {b.reasonLabel}
                    {b.reasonNote ? `: ${b.reasonNote}` : ""}
                  </p>
                )}
                {b.reschedule && <p className="text-small text-text-secondary">{proposalDetail(b, first)}</p>}
                {b.rescheduled && !b.reschedule && b.status === "SCHEDULED" && <p className="text-small text-text-secondary">Rescheduled{b.callSlug ? " · Video link is ready" : ""}</p>}
                {b.rating && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <Stars value={b.rating.stars} />
                      <span className="text-small text-text-secondary">Your rating of {who(b)}{b.role === "expert" ? " (private)" : ""}</span>
                    </div>
                    {b.rating.comment && <p className="text-small text-text-secondary mt-0.5">“{b.rating.comment}”</p>}
                  </div>
                )}
                {b.receivedRating && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <Stars value={b.receivedRating.stars} />
                      <span className="text-small text-text-secondary">Rating you received from {who(b)}</span>
                    </div>
                    {b.receivedRating.comment && <p className="text-small text-text-secondary mt-0.5">“{b.receivedRating.comment}”</p>}
                  </div>
                )}
                {b.report && (
                  <p className="text-small mt-1 font-medium">
                    {b.report.status === "OPEN" && <span className="text-warning">Reported. Our team replies within 2 working days.</span>}
                    {b.report.status === "REFUNDED" && <span className="text-success">Report decided: refunded.{b.report.note ? ` ${b.report.note}` : ""}</span>}
                    {b.report.status === "REJECTED" && <span className="text-text-secondary">Report decided: no refund.{b.report.note ? ` ${b.report.note}` : ""}</span>}
                  </p>
                )}
                {b.refund && (
                  <p className="text-small mt-1 font-medium text-success">
                    {b.refund.status === "DONE"
                      ? `Refund of ${rupees(b.refund.amountMinor)} sent. Banks can take a few days to show it.`
                      : `Refund of ${rupees(b.refund.amountMinor)} on its way. It should arrive by ${fmtDay(b.refund.dueBy)}.`}
                  </p>
                )}
                {(b.paid || (b.role === "expert" && b.priceMinor > 0 && b.status !== "PENDING_PAYMENT" && b.status !== "ABANDONED")) && (
                  <p className="text-small mt-1">
                    <Link href={`/bookings/${b.id}/receipt`} className="text-primary font-medium underline-offset-2 hover:underline">
                      {b.role === "expert" ? "See what you earn" : "See receipt"}
                    </Link>
                  </p>
                )}
              </div>
            </div>
            {(b.actions.length > 0 || (b.role === "requester" && (b.status === "CANCELLED" || b.status === "DECLINED" || b.status === "EXPIRED"))) && (
              <div className="flex flex-wrap items-center gap-2">
                {b.actions.includes("join") && b.callSlug && (
                  <ButtonLink href={`/call/${b.callSlug}`} size="sm" variant={isToday(b.startAt) ? "primary" : "secondary"}>
                    Join call
                  </ButtonLink>
                )}
                {b.actions.includes("accept") && (
                  <Button size="sm" variant="success" loading={busy === b.id} onClick={() => run(b, "accept")}>
                    Accept
                  </Button>
                )}
                {b.actions.includes("decline") && (
                  <Button size="sm" variant="outline" disabled={busy === b.id} onClick={() => setPending({ booking: b, action: "decline" })}>
                    Decline
                  </Button>
                )}
                {b.actions.includes("rate") && (
                  <Button size="sm" onClick={() => setRating(b)}>
                    Rate session
                  </Button>
                )}
                {b.actions.includes("report") && (
                  <Button size="sm" variant="outline" onClick={() => setReporting(b)}>
                    Report a problem
                  </Button>
                )}
                {b.actions.includes("reschedule_accept") && (
                  <Button size="sm" variant="success" loading={busy === b.id} onClick={() => answer(b, "accept")}>
                    <Icon icon={Check} size="sm" /> Accept new time
                  </Button>
                )}
                {b.actions.includes("reschedule_decline") && (
                  <Button size="sm" variant="outline" disabled={busy === b.id} onClick={() => answer(b, "decline")}>
                    Decline
                  </Button>
                )}
                {b.actions.includes("reschedule_withdraw") && (
                  <Button size="sm" variant="outline" loading={busy === b.id} onClick={() => answer(b, "withdraw")}>
                    Withdraw request
                  </Button>
                )}
                {b.actions.includes("reschedule") && b.status !== "PENDING" && (
                  <Button size="sm" variant="outline" disabled={busy === b.id} onClick={() => setRescheduling(b)}>
                    <Icon icon={CalendarClock} size="sm" /> Reschedule
                  </Button>
                )}
                {b.role === "requester" && (b.status === "CANCELLED" || b.status === "DECLINED" || b.status === "EXPIRED") && (
                  <ButtonLink href={`/book/${b.expertId}`} size="sm" variant="outline">
                    <Icon icon={CalendarClock} size="sm" /> Book a new time
                  </ButtonLink>
                )}
                {b.actions.includes("cancel") && (
                  <Button size="sm" variant="danger-ghost" disabled={busy === b.id} onClick={() => setPending({ booking: b, action: "cancel" })}>
                    Cancel booking
                  </Button>
                )}
              </div>
            )}
          </div>
          {b.reschedule && (
            <div className="bg-warning-light mt-4 flex items-start gap-3 rounded-md px-4 py-3">
              <span className="text-warning mt-0.5">
                <Icon icon={CalendarClock} size="sm" />
              </span>
              <div className="text-small min-w-0">
                <p className="text-text-primary font-semibold">
                  {b.reschedule.byMe ? "You proposed" : `${first} proposed`} <span className="whitespace-nowrap">{slotText(b.reschedule.startAt)}</span>
                </p>
                <p className="text-text-secondary">
                  {b.reschedule.byMe ? `Waiting for ${first} to accept — your original time stands until then.` : "Accept to move the session. If you decline, the original time stays."}
                </p>
                {(b.reschedule.reasonLabel || b.reschedule.note) && (
                  <p className="text-text-secondary mt-0.5">
                    Reason: {b.reschedule.reasonLabel === "Other" ? b.reschedule.note : b.reschedule.note ? `${b.reschedule.reasonLabel} — ${b.reschedule.note}` : b.reschedule.reasonLabel}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {error && !pending && (
        <div className="mb-4">
          <Banner tone="danger" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        </div>
      )}
      {grouped && needs.length > 0 ? (
        <div className="space-y-6 pb-8">
          <div>
            <SectionLabel className="mb-5">Needs your response</SectionLabel>
            <div>{needs.map(row)}</div>
          </div>
          {rest.length > 0 && (
            <div>
              <SectionLabel className="mb-5">Scheduled</SectionLabel>
              <div>{rest.map(row)}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="pb-8">{items.map(row)}</div>
      )}

      <RescheduleDialog booking={rescheduling} reasons={reasons} onClose={() => setRescheduling(null)} onDone={() => router.refresh()} onSent={(message) => setNotice({ message, tone: "success" })} />
      {notice && <Toast message={notice.message} tone={notice.tone} onDismiss={() => setNotice(null)} />}
      <RateDialog booking={rating} onClose={() => setRating(null)} onDone={() => router.refresh()} />
      <ReportDialog booking={reporting} onClose={() => setReporting(null)} onDone={() => router.refresh()} />

      <Modal
        open={!!pending}
        onClose={close}
        title={pending?.action === "decline" ? "Decline this request" : "Cancel this booking"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={close}>
              Keep it
            </Button>
            <Button variant="danger" size="sm" loading={busy !== null} disabled={!chosen || noteTooShort} onClick={submit}>
              {pending?.action === "decline" ? "Decline request" : "Cancel booking"}
            </Button>
          </>
        }
      >
        {pending && (
          <div className="space-y-4">
            {pending.booking.actions.includes("reschedule") && (
              <div className="bg-warning-light flex flex-wrap items-center justify-between gap-3 rounded-md px-4 py-3">
                <p className="text-small text-text-primary">
                  {pending.action === "decline"
                    ? `Only the time doesn’t suit? Suggest another one. If ${pending.booking.requesterName.split(" ")[0]} doesn’t take it, the request stays at the original time.`
                    : `Need a different time instead? Suggest a new one and keep the booking${pending.booking.priceMinor > 0 ? " and payment" : ""}.`}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const b = pending.booking;
                    close();
                    setRescheduling(b);
                  }}
                >
                  <Icon icon={CalendarClock} size="sm" /> Reschedule instead
                </Button>
              </div>
            )}
            <p className="text-small text-text-secondary">
              {(pending.booking.role === "expert" ? pending.booking.requesterName : pending.booking.expertName)} will be told, with your reason.
              {pending.booking.role === "expert" && pending.action !== "decline" ? " They can book a new time right away." : ""}
            </p>
            <fieldset className="space-y-2">
              <legend className="text-small text-text-primary mb-1 font-semibold">Reason</legend>
              {options.map((r) => (
                <label key={r.code} className="text-body flex cursor-pointer items-center gap-2">
                  <input type="radio" name="reason" value={r.code} checked={code === r.code} onChange={() => setCode(r.code)} className="accent-primary" />
                  {r.label}
                </label>
              ))}
            </fieldset>
            {chosen && (
              <div>
                <label htmlFor="reason-note" className="text-small text-text-primary mb-1 block font-semibold">
                  {chosen.needsNote ? "Add a short note" : "Add a note (optional)"}
                </label>
                <Textarea id="reason-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} error={noteTooShort && note.length > 0} />
                {chosen.needsNote && <p className="text-small text-text-secondary mt-1">At least 5 characters.</p>}
              </div>
            )}
            {error && <Banner tone="danger">{error}</Banner>}
          </div>
        )}
      </Modal>
    </>
  );
}
