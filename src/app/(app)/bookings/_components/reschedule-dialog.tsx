"use client";

import { useState } from "react";
import {
  Avatar,
  Button,
  SectionLabel,
  Select,
  Spinner,
  Textarea,
} from "@/components/atoms";
import { Banner, FormField, Modal } from "@/components/molecules";
import { Calendar } from "@/app/(app)/book/[expertId]/_components/calendar";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/ui";
import {
  getDays,
  getSlots,
  proposeReschedule,
  type ApiResult,
} from "@/lib/booking/client";
import {
  dateColumn,
  dayKey,
  daysBetween,
  daysInMonth,
  fmtDay,
  fmtDayLong,
  fmtTime,
  istDay,
  parseDay,
} from "@/lib/booking/time";
import { useLoaded } from "@/lib/booking/use-loaded";
import type { BookingReason, BookingView } from "@/lib/booking/types";

/**
 * "Suggest a new time". Either person can; the other has to accept, and the original time stands until they do.
 * Picked the way a booking is: a date on the month calendar first, then one of that day's open times (the booking flow's own
 * calendar and slots, so buffers, days off and other bookings already apply). Nothing long: one calendar, one row of times.
 */
export function RescheduleDialog({
  booking,
  reasons,
  onClose,
  onDone,
  onSent,
}: {
  booking: BookingView | null;
  reasons: BookingReason[];
  onClose: () => void;
  onDone: () => void;
  /** The wireframe's confirmation: "Reschedule request sent to X. Your original time stands until they accept." */
  onSent?: (message: string) => void;
}) {
  // a fresh dialog (and fresh state) for every booking it is opened on
  return booking ? (
    <RescheduleForm
      key={booking.id}
      booking={booking}
      reasons={reasons}
      onClose={onClose}
      onDone={onDone}
      onSent={onSent}
    />
  ) : null;
}

function RescheduleForm({
  booking,
  reasons,
  onClose,
  onDone,
  onSent,
}: {
  booking: BookingView;
  reasons: BookingReason[];
  onClose: () => void;
  onDone: () => void;
  onSent?: (message: string) => void;
}) {
  const today = istDay();
  const start = parseDay(today);
  const serviceId = booking.serviceId ?? null;

  const [ym, setYm] = useState({ y: start.y, m: start.m });
  const [day, setDay] = useState<string | null>(null);
  const [slotAt, setSlotAt] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- which days of this month are open, and the times on the chosen day ------------------------------------------------
  const monthFirst = dayKey(ym.y, ym.m, 1);
  const monthLast = dayKey(ym.y, ym.m, daysInMonth(ym.y, ym.m));
  const daysRes = useLoaded<
    ApiResult<{ days: { day: string; count: number }[] }>
  >(serviceId ? `${serviceId}|${monthFirst}` : null, (signal) => {
    if (monthLast < today)
      return Promise.resolve({ ok: true, status: 200, data: { days: [] } });
    const from = monthFirst < today ? today : monthFirst;
    return getDays(
      serviceId as number,
      from,
      Math.min(62, daysBetween(from, monthLast) + 1),
      signal,
    );
  });
  const counts: Record<string, number> | null = daysRes
    ? Object.fromEntries(
        (daysRes.data?.days ?? []).map((d) => [d.day, d.count]),
      )
    : null;
  const slotsRes = useLoaded(
    serviceId && day ? `${serviceId}|${day}` : null,
    (signal) => getSlots(serviceId as number, day as string, signal),
  );
  const slots = day && slotsRes ? (slotsRes.data?.slots ?? []) : null;

  const mine = booking.role === "expert" ? "expert" : "requester";
  const pickList = reasons.filter(
    (r) => r.action === "reschedule" && r.actor === mine,
  );
  const chosen = pickList.find((r) => r.label === reason);
  const noteTooShort = !!chosen?.needsNote && note.trim().length < 5;
  const other =
    booking.role === "requester" ? booking.expertName : booking.requesterName;
  const first = other.split(" ")[0];
  const d = dateColumn(booking.startAt);
  const ready = !!slotAt && !!chosen && !noteTooShort && !busy;

  function pickDay(value: string) {
    const p = parseDay(value);
    setYm({ y: p.y, m: p.m });
    setDay(value);
    setSlotAt(null);
    setError(null);
  }

  async function submit() {
    if (!slotAt || !chosen) return;
    setBusy(true);
    setError(null);
    const res = await proposeReschedule(booking.id, {
      startAt: slotAt,
      reason: chosen.code,
      note: note.trim(),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong. Please try again.");
      if (res.status === 409 || res.status === 404) onDone(); // the booking changed under us: show what is true now
      return;
    }
    onSent?.(
      `Reschedule request sent to ${first}. Your original time stands until they accept.`,
    );
    onDone();
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title="Suggest a new time"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Never mind
          </Button>
          <Button size="sm" loading={busy} disabled={!ready} onClick={submit}>
            Send request
          </Button>
        </>
      }
    >
      {!serviceId ? (
        <Banner tone="danger">
          This service is no longer offered, so the session cannot be moved.
        </Banner>
      ) : (
        <div className="space-y-5">
          <div className="border-border-light bg-bg-subtle flex items-center gap-3 rounded-md border p-3">
            <Avatar alt={other} size="md" />
            <div className="min-w-0">
              <p className="text-body text-text-primary truncate font-semibold">
                {booking.serviceTitle}
              </p>
              <p className="text-small text-text-secondary truncate">
                with {other} · {d.month} {d.day} · {fmtTime(booking.startAt)} ·{" "}
                {booking.durationMin} min
              </p>
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-5 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
            <div>
              <SectionLabel className="mb-2">1 · Pick a date</SectionLabel>
              <Calendar
                y={ym.y}
                m={ym.m}
                today={today}
                counts={counts}
                selected={day}
                onPick={pickDay}
                onMonth={(y, m) => setYm({ y, m })}
              />
              {daysRes && !daysRes.ok && (
                <p className="text-small text-danger mt-2">{daysRes.error}</p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <SectionLabel className="mb-2">2 · Pick a time</SectionLabel>
                {!day ? (
                  <p className="text-small text-text-secondary">
                    Pick a date to see the available times.
                  </p>
                ) : slots === null ? (
                  <div className="text-small text-text-secondary flex items-center gap-2">
                    <Spinner /> Loading times…
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-small text-text-secondary">
                    No times left on {fmtDayLong(day)}. Try another date.
                  </p>
                ) : (
                  <>
                    <div
                      role="radiogroup"
                      aria-label={`Times on ${fmtDayLong(day)}`}
                      className="grid grid-cols-3 gap-2"
                    >
                      {slots.map((s) => (
                        <button
                          key={s.startAt}
                          type="button"
                          role="radio"
                          aria-checked={s.startAt === slotAt}
                          onClick={() => setSlotAt(s.startAt)}
                          className={cn(
                            "text-small rounded-sm border px-2 py-2 font-semibold transition-colors",
                            focusRing,
                            s.startAt === slotAt
                              ? "border-primary bg-primary text-white"
                              : "border-border-hover bg-surface-light text-text-primary hover:border-primary",
                          )}
                        >
                          {fmtTime(s.startAt)}
                        </button>
                      ))}
                    </div>
                    <p className="text-small text-text-secondary mt-2">
                      Times are shown in India Standard Time (IST).
                    </p>
                  </>
                )}
                <p className="text-small text-text-secondary mt-3">
                  {slotAt ? (
                    <span className="text-primary font-semibold">
                      New time: {fmtDay(slotAt)} · {fmtTime(slotAt)}.{" "}
                    </span>
                  ) : null}
                  {first} has to accept. Until they do, your original time (
                  {d.weekday} · {fmtTime(booking.startAt)}) stands. If they
                  decline, nothing changes.
                </p>
              </div>

              <FormField
                label="Why do you need a new time?"
                htmlFor="rs-reason"
                required
              >
                <Select
                  id="rs-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="" disabled>
                    Choose a reason
                  </option>
                  {pickList.map((r) => (
                    <option key={r.code} value={r.label}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label={
                  chosen?.needsNote ? "Tell us more" : "Add a note (optional)"
                }
                htmlFor="rs-note"
                required={!!chosen?.needsNote}
                hint={
                  chosen?.needsNote
                    ? "At least 5 characters."
                    : `Shared with ${first}.`
                }
              >
                <Textarea
                  id="rs-note"
                  rows={2}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything that helps them decide…"
                />
              </FormField>
            </div>
          </div>

          {error && <Banner tone="danger">{error}</Banner>}
        </div>
      )}
    </Modal>
  );
}
