"use client";

import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Button, Icon } from "@/components/atoms";
import { RescueConfirm } from "./rescue-confirm";
import { getRescueOptions } from "@/lib/booking/client";
import { bestMatch } from "@/lib/booking/rescue";
import { fmtDay, fmtTime, rupees } from "@/lib/booking/time";
import { useLoaded } from "@/lib/booking/use-loaded";
import type { BookingView } from "@/lib/booking/types";

/**
 * Top of the list: the one-click way to keep a paid session an expert could not keep. It books the best match (the same expert's
 * soonest new time, else the closest-expertise expert's) after a short confirmation. Nothing to pay: the money is already held.
 */
export function QuickRescue({ booking, onSeeOptions, onDone }: { booking: BookingView; onSeeOptions: () => void; onDone: (message: string) => void }) {
  const loaded = useLoaded(`quick-rescue-${booking.id}`, (signal) => getRescueOptions(booking.id, signal));
  const match = loaded?.ok && loaded.data ? bestMatch(loaded.data, booking.expertName) : null;
  const [confirming, setConfirming] = useState(false);
  const first = booking.expertName.split(" ")[0];
  if (!match) return null;
  const when = `${fmtDay(match.startAt)}, ${fmtTime(match.startAt)}`;

  return (
    <>
      <section className="bg-success-light mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-lg px-5 py-4" aria-label="Keep your session">
        <div className="flex min-w-0 flex-1 basis-72 items-start gap-3">
          <span aria-hidden className="bg-success mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white">
            <Icon icon={CalendarCheck} size="sm" className="size-3.5!" />
          </span>
          <div>
            <p className="text-large text-text-primary font-bold">Your {rupees(booking.priceMinor)} is safe. Keep your session in one click.</p>
            <p className="text-body text-text-secondary mt-0.5">
              {match.sameExpert ? `${first} is free` : `${match.who} is a close match and is free`} on <span className="text-text-primary font-semibold">{when}</span>. Nothing to pay.
              {loaded?.ok && loaded.data ? ` Decide by ${fmtDay(loaded.data.expiresAt)}, ${fmtTime(loaded.data.expiresAt)}.` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onSeeOptions}>
            See other options
          </Button>
          <Button onClick={() => setConfirming(true)}>Book {when}</Button>
        </div>
      </section>

      <RescueConfirm
        booking={booking}
        pick={confirming ? match : null}
        onClose={() => setConfirming(false)}
        onDone={(message) => {
          setConfirming(false);
          onDone(message);
        }}
      />
    </>
  );
}
