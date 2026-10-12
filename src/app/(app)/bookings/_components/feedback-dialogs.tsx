"use client";

import { useState } from "react";
import { Button, Textarea } from "@/components/atoms";
import { Banner, Modal } from "@/components/molecules";
import { StarPicker } from "@/components/domain";
import { rateBooking, reportBooking } from "@/lib/booking/client";
import { REPORT_TYPES, type BookingView, type ReportType } from "@/lib/booking/types";

/** Rate a completed session: 1 to 5 stars (required) and an optional comment. Submit stays off until a star is chosen. */
export function RateDialog({ booking, onClose, onDone }: { booking: BookingView | null; onClose: () => void; onDone: () => void }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setStars(0);
    setComment("");
    setError(null);
    onClose();
  }

  async function submit() {
    if (!booking || stars === 0 || busy) return;
    setBusy(true);
    setError(null);
    const res = await rateBooking(booking.id, { stars, comment: comment.trim() });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      // already rated, or the time to rate has passed: show what is true now
      if (res.status === 409) onDone();
      return;
    }
    close();
    onDone();
  }

  return (
    <Modal
      open={!!booking}
      onClose={close}
      title="Rate the session"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={close}>
            Not now
          </Button>
          <Button size="sm" loading={busy} disabled={stars === 0} onClick={submit}>
            Submit rating
          </Button>
        </>
      }
    >
      {booking && (
        <div className="space-y-4">
          <p className="text-small text-text-secondary">
            {booking.serviceTitle} with <span className="text-text-primary font-medium">{booking.role === "requester" ? booking.expertName : booking.requesterName}</span>. You can rate a session once.
          </p>
          <p className="text-small text-text-secondary">
            {booking.role === "requester" ? "Your rating and comment are shown on the expert’s profile." : "Your rating is private: only GCODE sees it. It is not shown to the booker or on any profile."}
          </p>
          <StarPicker value={stars} onChange={setStars} />
          <div>
            <label htmlFor="rate-comment" className="text-small text-text-primary mb-1 block font-semibold">
              Add a comment (optional)
            </label>
            <Textarea id="rate-comment" rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
            <p className="text-small text-text-secondary mt-1">{comment.length} / 500</p>
          </div>
          {error && <Banner tone="danger">{error}</Banner>}
        </div>
      )}
    </Modal>
  );
}

/** Report a problem. Says up front that support decides and that nothing is refunded before then. */
export function ReportDialog({ booking, onClose, onDone }: { booking: BookingView | null; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState<ReportType | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsNote = type === "OTHER";
  const noteTooShort = needsNote && note.trim().length < 5;

  function close() {
    setType("");
    setNote("");
    setError(null);
    onClose();
  }

  async function submit() {
    if (!booking || !type || noteTooShort || busy) return;
    setBusy(true);
    setError(null);
    const res = await reportBooking(booking.id, { type, note: note.trim() });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      if (res.status === 409) onDone();
      return;
    }
    close();
    onDone();
  }

  const paidBooker = booking?.role === "requester" && booking.priceMinor > 0;

  return (
    <Modal
      open={!!booking}
      onClose={close}
      title="Report a problem"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={close}>
            Cancel
          </Button>
          <Button size="sm" loading={busy} disabled={!type || noteTooShort} onClick={submit}>
            Send report
          </Button>
        </>
      }
    >
      {booking && (
        <div className="space-y-4">
          <p className="text-small text-text-secondary">
            Our team looks at every report and replies within 2 working days.{" "}
            {paidBooker ? "If we agree there was a problem, we refund you. Nothing is refunded before we have decided." : "Nothing changes for either person before we have decided."}
          </p>
          <fieldset className="space-y-2">
            <legend className="text-small text-text-primary mb-1 font-semibold">What went wrong?</legend>
            {REPORT_TYPES.map((t) => (
              <label key={t.value} className="text-body flex cursor-pointer items-start gap-2">
                <input type="radio" name="report-type" value={t.value} checked={type === t.value} onChange={() => setType(t.value)} className="accent-primary mt-1" />
                <span>
                  {t.label}
                  {type === t.value && <span className="text-small text-text-secondary block">{t.hint}</span>}
                </span>
              </label>
            ))}
          </fieldset>
          {type && (
            <div>
              <label htmlFor="report-note" className="text-small text-text-primary mb-1 block font-semibold">
                {needsNote ? "Tell us what happened" : "Add a note (optional)"}
              </label>
              <Textarea id="report-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} error={noteTooShort && note.length > 0} />
              {needsNote && <p className="text-small text-text-secondary mt-1">At least 5 characters.</p>}
            </div>
          )}
          {error && <Banner tone="danger">{error}</Banner>}
        </div>
      )}
    </Modal>
  );
}
