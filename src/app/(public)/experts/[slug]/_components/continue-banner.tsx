"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { Button, Icon } from "@/components/atoms";
import { RescuePicker } from "@/app/(app)/bookings/_components/rescue-picker";
import { fmtDay, fmtTime, rupees } from "@/lib/booking/time";
import type { BookingView } from "@/lib/booking/types";

/**
 * Above an expert's profile, for someone whose paid session was not kept and who is looking at one of the offered experts (or the
 * original one at a new time): carry on with this person, no payment. Book opens that expert's times; confirming rebooks the SAME
 * booking, so the money already held moves with it.
 */
export function ContinueBanner({
  booking,
  expertName,
  offer,
  expiresAt,
  autoOpen,
}: {
  booking: BookingView;
  expertName: string;
  /** What this expert is offered for the paid session: their service and the times we suggest. */
  offer: { serviceId: number; slots: string[] };
  expiresAt: string;
  /** The profile's own service button for this session was used (?keep=1): open the picker straight away. */
  autoOpen?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [asked, setAsked] = useState(false);
  // open from the button here, or because the profile's own button for this session was used (the address then carries ?keep=1)
  const open = asked || !!autoOpen;
  const close = () => {
    setAsked(false);
    if (autoOpen) router.replace(pathname, { scroll: false });
  };
  if (offer.slots.length === 0) return null;
  const first = expertName.split(" ")[0];

  return (
    <>
      <section className="bg-success-light mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-lg px-5 py-4" aria-label="Continue your session">
        <div className="flex min-w-0 flex-1 basis-72 items-start gap-3">
          <span aria-hidden className="bg-success mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white">
            <Icon icon={CalendarCheck} size="sm" className="size-3.5!" />
          </span>
          <div>
            <p className="text-large text-text-primary font-bold">Continue your session with {first}</p>
            <p className="text-body text-text-secondary mt-0.5">
              Your {rupees(booking.priceMinor)} is safe and moves with you. Same price, nothing to pay. Decide by{" "}
              <span className="text-text-primary font-semibold">
                {fmtDay(expiresAt)}, {fmtTime(expiresAt)}
              </span>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/bookings?rescue=${booking.id}`)}>
            See all options
          </Button>
          <Button onClick={() => setAsked(true)}>Book with {first}</Button>
        </div>
      </section>

      {open && (
        <RescuePicker
          booking={booking}
          serviceId={offer.serviceId}
          who={expertName}
          suggested={offer.slots[0]}
          onClose={close}
          onDone={(_message, startAt) => router.push(`/bookings?kept=${encodeURIComponent(`${expertName}|${startAt}`)}`)}
        />
      )}
    </>
  );
}
