import { useId } from "react";
import { CalendarClock, CircleX } from "lucide-react";
import { Avatar, Button, Select, SectionLabel, Textarea } from "@/components/atoms";
import { Banner } from "@/components/molecules/banner";
import { FormField } from "@/components/molecules/form-field";
import { IconTile } from "@/components/molecules/icon-tile";
import { Modal } from "@/components/molecules/modal";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/ui";

export type BookingDialogKind = "cancel" | "decline" | "reschedule";

export interface BookingDialogBooking {
  name: string;
  topic: string;
  /** e.g. "Oct" */
  month: string;
  /** e.g. "02" */
  day: string;
  /** e.g. "Fri · 5:00 PM · 45 min" */
  when: string;
  /** Amount paid, in rupees. Free sessions omit it. */
  paid?: number;
  avatarSrc?: string;
}

export interface BookingDialogProps {
  kind: BookingDialogKind;
  /** Which side is acting: `consulting` (the person who booked) or `expert`. */
  side: "consulting" | "expert";
  booking: BookingDialogBooking;
  reasons: string[];
  /** Proposed times, reschedule only. */
  slots?: { label: string }[];
  reason: string;
  note: string;
  slot: number | null;
  onReasonChange?: (reason: string) => void;
  onNoteChange?: (note: string) => void;
  onSlotChange?: (slot: number) => void;
  onConfirm?: () => void;
  onClose?: () => void;
  /** A problem from the last attempt, shown above the buttons. */
  error?: string | null;
  /** The request is in flight: the confirm button spins and is disabled. */
  busy?: boolean;
  /** Render in place instead of a portal (previews, Storybook). */
  inline?: boolean;
}

const COPY = {
  cancel: { icon: CircleX, tone: "danger", title: "Cancel this session?", confirm: "Cancel session", variant: "danger", dismiss: "Keep booking" },
  decline: { icon: CircleX, tone: "danger", title: "Decline this request?", confirm: "Decline request", variant: "danger", dismiss: "Keep booking" },
  reschedule: { icon: CalendarClock, tone: "primary", title: "Suggest a new time", confirm: "Send request", variant: "primary", dismiss: "Never mind" },
} as const;

const noop = () => {};
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Confirm stays disabled until a reason is chosen (and a note is written for "Other", and a slot for reschedule). */
export const isBookingDialogValid = (kind: BookingDialogKind, reason: string, note: string, slot: number | null) =>
  !!reason && (reason !== "Other" || note.trim().length >= 5) && (kind !== "reschedule" || slot !== null);

/**
 * The dialog for the three "needs a reason" actions on a booking: cancel and decline (reason required, refund within
 * 7 days) and reschedule (reason required, the OTHER side must accept).
 */
export function BookingDialog({
  kind,
  side,
  booking,
  reasons,
  slots = [],
  reason,
  note,
  slot,
  onReasonChange,
  onNoteChange,
  onSlotChange,
  onConfirm,
  onClose,
  error,
  busy,
  inline,
}: BookingDialogProps) {
  const titleId = useId();
  const first = booking.name.split(" ")[0];
  const copy = COPY[kind];
  const amount = booking.paid ? rupees(booking.paid) : "";
  const other = reason === "Other";

  return (
    <Modal
      open
      onClose={onClose ?? noop}
      inline={inline}
      size="lg"
      labelledBy={titleId}
      bodyClassName="space-y-5 p-6 sm:p-8"
      panelClassName="rounded-lg"
    >
      <div className="flex items-center gap-3">
        <IconTile icon={copy.icon} tone={copy.tone} size="lg" />
        <h2 id={titleId} className="text-heading text-text-primary font-extrabold">
          {copy.title}
        </h2>
      </div>

      <div className="border-border-light bg-bg-subtle flex items-center gap-3 rounded-md border p-3">
        <Avatar alt={booking.name} src={booking.avatarSrc} size="md" />
        <div className="min-w-0">
          <p className="text-body text-text-primary truncate font-semibold">{booking.topic}</p>
          <p className="text-small text-text-secondary truncate">
            with {booking.name} · {booking.month} {booking.day} · {booking.when.split(" · ").slice(1).join(" · ")}
          </p>
        </div>
      </div>

      {kind !== "reschedule" && booking.paid ? (
        <Banner tone="info">
          {side === "expert"
            ? `${first} is refunded ${amount} in full, within 7 days. ${first} sees your reason.`
            : `You’ll get ${amount} back in full to your original payment method within 7 days. ${first} sees your reason.`}
        </Banner>
      ) : null}

      {kind === "reschedule" && (
        <div>
          <SectionLabel className="mb-2">Propose a new time</SectionLabel>
          <div role="radiogroup" aria-label="New time" className="grid gap-2 sm:grid-cols-2">
            {slots.map((s, i) => (
              <button
                key={s.label}
                type="button"
                role="radio"
                aria-checked={slot === i}
                onClick={() => onSlotChange?.(i)}
                className={cn(
                  "text-small rounded-md border-2 px-3 py-2.5 text-left font-semibold transition-colors",
                  focusRing,
                  slot === i
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border-light bg-surface-light text-text-primary hover:border-border-hover",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-small text-text-secondary mt-2">
            {first} has to accept. Until they do, your original time ({booking.when.split(" · ").slice(0, 2).join(" · ")}) stands. If
            they decline, nothing changes.
          </p>
        </div>
      )}

      <FormField
        label={kind === "reschedule" ? "Why do you need a new time?" : "Reason"}
        htmlFor="bm-reason"
        required
      >
        <Select
          id="bm-reason"
          value={reason}
          onChange={(e) => onReasonChange?.(e.target.value)}
        >
          <option value="" disabled>
            Choose a reason
          </option>
          {reasons.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label={other ? "Tell us more" : "Add a note (optional)"}
        htmlFor="bm-note"
        required={other}
        hint={other ? "At least 5 characters." : `Shared with ${first}.`}
      >
        <Textarea
          id="bm-note"
          rows={3}
          value={note}
          onChange={(e) => onNoteChange?.(e.target.value)}
          placeholder={
            kind === "reschedule" ? "Anything that helps them decide…" : "A short, polite explanation helps…"
          }
        />
      </FormField>

      {error && <Banner tone="danger">{error}</Banner>}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        <Button variant="ghost" onClick={onClose}>
          {copy.dismiss}
        </Button>
        <Button variant={copy.variant} onClick={onConfirm} loading={busy} disabled={busy || !isBookingDialogValid(kind, reason, note, slot)}>
          {copy.confirm}
        </Button>
      </div>
    </Modal>
  );
}
