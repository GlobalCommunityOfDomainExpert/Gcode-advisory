"use client";

import { useState } from "react";
import { Button } from "@/components/atoms";
import { Modal } from "@/components/molecules";
import { rebookRescue } from "@/lib/booking/client";
import { fmtDay, fmtTime, rupees } from "@/lib/booking/time";
import type { BookingView } from "@/lib/booking/types";

export interface RescuePick {
  serviceId: number;
  startAt: string;
  who: string;
}

/** The small "are you sure" before a rescued session is rebooked. Same price, so nothing to pay: the held money moves with the session. */
export function RescueConfirm({ booking, pick, onClose, onDone }: { booking: BookingView; pick: RescuePick | null; onClose: () => void; onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const when = pick ? `${fmtDay(pick.startAt)}, ${fmtTime(pick.startAt)}` : "";

  async function book() {
    if (!pick) return;
    setBusy(true);
    setError(null);
    const res = await rebookRescue(booking.id, { serviceId: pick.serviceId, startAt: pick.startAt });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    onDone(`Request sent to ${pick.who} for ${when}. Your payment stays with it, nothing more to pay.`);
  }

  return (
    <Modal
      open={!!pick}
      onClose={() => (busy ? undefined : onClose())}
      title="Keep your session?"
      footer={
        <>
          <Button variant="outline" size="sm" disabled={busy} onClick={onClose}>
            Not now
          </Button>
          <Button size="sm" loading={busy} onClick={book}>
            Yes, book it
          </Button>
        </>
      }
    >
      {pick && (
        <div className="space-y-3">
          <p className="text-body text-text-primary">
            <span className="font-semibold">{pick.who}</span> on <span className="font-semibold">{when}</span>, {booking.durationMin} min.
          </p>
          <p className="text-small text-success font-medium">Same price. Nothing more to pay: your {rupees(booking.priceMinor)} moves with the session.</p>
          {error && <p className="text-small text-danger">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
