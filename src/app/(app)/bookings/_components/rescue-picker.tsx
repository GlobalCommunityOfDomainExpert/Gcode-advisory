"use client";

import { useState } from "react";
import { Button, Spinner } from "@/components/atoms";
import { Modal } from "@/components/molecules";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/ui";
import { getDays, getSlots, rebookRescue, type ApiResult } from "@/lib/booking/client";
import { dayKey, daysBetween, daysInMonth, fmtDayLong, fmtTime, istDay, parseDay, rupees } from "@/lib/booking/time";
import { useLoaded } from "@/lib/booking/use-loaded";
import type { BookingView } from "@/lib/booking/types";
import { Calendar } from "../../book/[expertId]/_components/calendar";

/**
 * The full date and time picker for keeping a rescued session with one expert (the same calendar the booking page uses). Confirming
 * rebooks the SAME booking, so the money already held moves with it and there is nothing to pay.
 */
export function RescuePicker({
  booking,
  serviceId,
  who,
  suggested,
  onClose,
  onDone,
}: {
  booking: BookingView;
  serviceId: number;
  who: string;
  /** The time we suggested: the picker opens on its day with it already chosen, so confirming takes one click. */
  suggested?: string;
  onClose: () => void;
  /** Called with a sentence for the toast once the new time is booked. */
  onDone: (message: string, startAt: string) => void;
}) {
  const today = istDay();
  const startDay = suggested ? istDay(suggested) : undefined;
  const first = startDay && startDay >= today ? startDay : today;
  const start = parseDay(first);
  const [ym, setYm] = useState({ y: start.y, m: start.m });
  const [day, setDay] = useState<string | null>(startDay && startDay >= today ? startDay : null);
  const [slotAt, setSlotAt] = useState<string | null>(startDay && startDay >= today ? (suggested ?? null) : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthFirst = dayKey(ym.y, ym.m, 1);
  const monthLast = dayKey(ym.y, ym.m, daysInMonth(ym.y, ym.m));
  const daysRes = useLoaded<ApiResult<{ days: { day: string; count: number }[] }>>(`${serviceId}|${monthFirst}`, (signal) => {
    if (monthLast < today) return Promise.resolve({ ok: true, status: 200, data: { days: [] } });
    const from = monthFirst < today ? today : monthFirst;
    return getDays(serviceId, from, Math.min(62, daysBetween(from, monthLast) + 1), signal);
  });
  const counts: Record<string, number> | null = daysRes ? Object.fromEntries((daysRes.data?.days ?? []).map((d) => [d.day, d.count])) : null;

  const slotsRes = useLoaded(day ? `${serviceId}|${day}` : null, (signal) => getSlots(serviceId, day as string, signal));
  const slots = day && slotsRes ? (slotsRes.data?.slots ?? []) : null;

  function pickDay(d: string) {
    const p = parseDay(d);
    setYm({ y: p.y, m: p.m });
    setDay(d);
    setSlotAt(null);
    setError(null);
  }

  async function confirm() {
    if (!slotAt) return;
    setBusy(true);
    setError(null);
    const res = await rebookRescue(booking.id, { serviceId, startAt: slotAt });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    onDone(`Request sent to ${who} for ${fmtDayLong(slotAt)}, ${fmtTime(slotAt)}. Your payment stays with it, nothing more to pay.`, slotAt);
  }

  return (
    <Modal
      open
      onClose={() => (busy ? undefined : onClose())}
      title={`Pick a date and time with ${who.split(" ")[0]}`}
      size="xl"
      footer={
        <div className="flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" size="sm" disabled={busy} onClick={onClose}>
            Back
          </Button>
          <Button loading={busy} disabled={!slotAt} onClick={confirm}>
            {slotAt ? `Confirm ${fmtTime(slotAt)}` : "Pick a time"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-small text-success font-medium">Same price. Nothing more to pay: your {rupees(booking.priceMinor)} moves with the session.</p>
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
          <section>
            <p className="text-small text-text-secondary mb-3 font-semibold">Date</p>
            <Calendar y={ym.y} m={ym.m} today={today} counts={counts} selected={day} onPick={pickDay} onMonth={(y, m) => setYm({ y, m })} />
            {daysRes && !daysRes.ok && <p className="text-small text-danger mt-3">{daysRes.error}</p>}
          </section>
          <section>
            <p className="text-small text-text-secondary mb-3 font-semibold">Time</p>
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
                <p className="text-body text-text-primary mb-3 font-semibold">{fmtDayLong(day)}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
        {error && <p className="text-small text-danger">{error}</p>}
      </div>
    </Modal>
  );
}
