"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { Button, Icon, Spinner } from "@/components/atoms";
import { Banner, Modal } from "@/components/molecules";
import { RescueConfirm, type RescuePick } from "./rescue-confirm";
import { RescuePicker } from "./rescue-picker";
import { ExpertCardView } from "../../directory/_components/expert-card";
import { rescueExpertCard } from "@/lib/booking/rescue";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/ui";
import { getRescueOptions, rebookRescue, refundRescue } from "@/lib/booking/client";
import { fmtDay, fmtTime, rupees } from "@/lib/booking/time";
import { useLoaded } from "@/lib/booking/use-loaded";
import type { BookingView, RescueExpert } from "@/lib/booking/types";

interface Choice {
  serviceId: number;
  startAt: string;
  who: string;
}

/**
 * "Keep your session". A paid request the expert could not keep is not refunded at once: the booker can take another time with
 * the same expert, or another expert at exactly the same price (nothing more to pay), or ask for the money back. If they do
 * nothing the refund starts when the time shown runs out. The backend decides who can be offered; this only shows it.
 */
export function RescueDialog({
  booking,
  onClose,
  onDone,
}: {
  booking: BookingView | null;
  onClose: () => void;
  /** Called after a choice went through, with a sentence for the toast. */
  onDone: (message: string) => void;
}) {
  return booking ? <RescueForm key={booking.id} booking={booking} onClose={onClose} onDone={onDone} /> : null;
}

function RescueForm({ booking, onClose, onDone }: { booking: BookingView; onClose: () => void; onDone: (message: string) => void }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [cardPick, setCardPick] = useState<RescuePick | null>(null);
  // the full date and time picker, for one expert's service
  const [picker, setPicker] = useState<{ serviceId: number; who: string; suggested: string } | null>(null);
  const [busy, setBusy] = useState<"keep" | "refund" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loaded = useLoaded(`rescue-${booking.id}`, (signal) => getRescueOptions(booking.id, signal));
  const options = loaded?.ok ? loaded.data : undefined;
  const nothing = !!loaded && (!options || (!options.sameExpert && options.others.length === 0));
  const first = booking.expertName.split(" ")[0];

  async function keep() {
    if (!choice) return;
    setBusy("keep");
    setError(null);
    const res = await rebookRescue(booking.id, { serviceId: choice.serviceId, startAt: choice.startAt });
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    onDone(`Request sent to ${choice.who} for ${fmtDay(choice.startAt)}, ${fmtTime(choice.startAt)}. Your payment stays with it, nothing more to pay.`);
    onClose();
  }

  async function refund() {
    setBusy("refund");
    setError(null);
    const res = await refundRescue(booking.id);
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    onDone(`Your refund of ${rupees(booking.priceMinor)} has started.`);
    onClose();
  }

  function slotButtons(serviceId: number, slots: string[], who: string, extra?: ReactNode) {
    const days: { label: string; times: string[] }[] = [];
    for (const startAt of slots) {
      const label = fmtDay(startAt);
      const last = days[days.length - 1];
      if (last?.label === label) last.times.push(startAt);
      else days.push({ label, times: [startAt] });
    }
    return (
      <div className="space-y-3">
        {days.map((d, i) => (
          <div key={d.label} className="space-y-2">
            <p className="text-small text-text-secondary font-medium">{d.label}</p>
            <div className="flex flex-wrap gap-2">
              {d.times.map((startAt) => {
                const on = choice?.serviceId === serviceId && choice.startAt === startAt;
                return (
                  <button
                    key={startAt}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setChoice({ serviceId, startAt, who })}
                    className={cn(
                      "text-small rounded-full border px-3.5 py-1.5 font-semibold whitespace-nowrap transition-colors",
                      focusRing,
                      on ? "border-primary bg-primary text-white" : "border-border-light hover:border-primary text-text-primary bg-white",
                    )}
                  >
                    {fmtTime(startAt)}
                  </button>
                );
              })}
              {i === days.length - 1 && extra}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Keep your session"
      size="2xl"
      footer={
        <div className="flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" size="sm" loading={busy === "refund"} disabled={busy !== null} onClick={refund}>
            I'd rather have my {rupees(booking.priceMinor)} back
          </Button>
          <div className="flex items-center gap-3 sm:justify-end">
            {choice && <span className="text-small text-text-secondary hidden truncate sm:block">{choice.who} · {fmtDay(choice.startAt)}, {fmtTime(choice.startAt)}</span>}
            <Button size="md" className="flex-1 sm:flex-none" loading={busy === "keep"} disabled={!choice || busy !== null} onClick={keep}>
              {choice ? "Confirm this time" : "Pick a time to continue"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-8 py-1">
        <div className="bg-success-light flex items-start gap-3 rounded-lg px-5 py-4">
          <span aria-hidden className="bg-success mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">✓</span>
          <div>
            <p className="text-large text-text-primary font-bold">Your {rupees(booking.priceMinor)} is safe. Just pick a new time.</p>
            <p className="text-body text-text-secondary mt-1">
              {first} can't make it. Choose another slot and you're set, with nothing more to pay.
              {options && (
                <>
                  {" "}Decide by <span className="text-text-primary font-semibold">{fmtDay(options.expiresAt)}, {fmtTime(options.expiresAt)}</span>.
                </>
              )}
            </p>
          </div>
        </div>

        {!loaded && (
          <div className="flex items-center gap-2" role="status">
            <Spinner /> <span className="text-small text-text-secondary">Finding times…</span>
          </div>
        )}
        {nothing && <Banner tone="info">There is nothing to offer right now. You can ask for your refund below.</Banner>}

        {options?.sameExpert && (
          <section className="space-y-4">
            <h4 className="text-large text-text-primary font-bold">Stay with {first}</h4>
            {slotButtons(
              options.sameExpert.serviceId,
              options.sameExpert.slots,
              booking.expertName,
              <button
                type="button"
                onClick={() => options.sameExpert && setPicker({ serviceId: options.sameExpert.serviceId, who: booking.expertName, suggested: options.sameExpert.slots[0] })}
                className={cn("text-small border-primary text-primary hover:bg-primary-light inline-flex items-center gap-1.5 rounded-full border border-dashed px-3.5 py-1.5 font-semibold whitespace-nowrap transition-colors", focusRing)}
              >
                <Icon icon={CalendarDays} size="sm" className="size-3.5!" />
                Pick your time
              </button>,
            )}
          </section>
        )}

        {options && options.others.length > 0 && (
          <section className="space-y-4">
            <div>
              <h4 className="text-large text-text-primary font-bold">Or try someone similar</h4>
              <p className="text-body text-text-secondary mt-1">Same price, same length.</p>
            </div>
            <div className={cn("grid gap-5 sm:grid-cols-2", options.others.length > 2 && "lg:grid-cols-3")}>
              {options.others.map((e: RescueExpert) => {
                const shared = new Set([...(e.sharedDomains ?? []), ...(e.sharedSkills ?? [])]);
                return (
                  <ExpertCardView
                    key={e.serviceId}
                    expert={rescueExpertCard(e)}
                    paymentsEnabled
                    nextLabel="Suggested"
                    highlight={[...shared]}
                    selected={cardPick?.serviceId === e.serviceId}
                    newTab
                    footer={
                      <div className="space-y-3">
                        <p className="text-small text-success font-semibold">Same price, nothing to pay.</p>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          {e.slug && (
                            <a href={`/experts/${e.slug}`} target="_blank" rel="noopener noreferrer" className="text-small text-primary font-semibold underline-offset-2 hover:underline">
                              View full profile
                            </a>
                          )}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setPicker({ serviceId: e.serviceId, who: e.name, suggested: e.slots[0] })}
                              className="text-small text-primary font-semibold underline-offset-2 hover:underline"
                            >
                              Other times
                            </button>
                            <Button size="sm" disabled={!e.slots[0]} onClick={() => setCardPick({ serviceId: e.serviceId, startAt: e.slots[0], who: e.name })}>
                              Book
                            </Button>
                          </div>
                        </div>
                      </div>
                    }
                  />
                );
              })}
            </div>
          </section>
        )}
        {error && <Banner tone="danger">{error}</Banner>}
      </div>
      {picker && (
        <RescuePicker
          booking={booking}
          serviceId={picker.serviceId}
          who={picker.who}
          suggested={picker.suggested}
          onClose={() => setPicker(null)}
          onDone={(message) => {
            setPicker(null);
            onDone(message);
            onClose();
          }}
        />
      )}
      <RescueConfirm
        booking={booking}
        pick={cardPick}
        onClose={() => setCardPick(null)}
        onDone={(message) => {
          setCardPick(null);
          onDone(message);
          onClose();
        }}
      />
    </Modal>
  );
}
