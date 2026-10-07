import { ReactNode } from "react";
import { Check, CalendarClock, RotateCcw, Video } from "lucide-react";
import { Avatar, Badge, BadgeTone, Button, Icon } from "@/components/atoms";

export type BookingStatus = "pending" | "scheduled" | "reschedule" | "completed" | "declined" | "cancelled";
/** `consulting` = the person who booked (Fresher / Intern, Startup, Institution). `expert` = the Domain Expert being booked. */
export type BookingSide = "consulting" | "expert";

export interface BookingRowData {
  id: string;
  status: BookingStatus;
  /** Who proposed a reschedule. */
  by?: "you" | "them";
  name: string;
  topic: string;
  /** e.g. "Oct" */
  month: string;
  /** e.g. "02" */
  day: string;
  /** e.g. "Fri · 5:00 PM · 45 min" */
  when: string;
  detail: string;
  /** Session starts soon: Join call becomes the primary button. */
  soon?: boolean;
  refund?: string;
  proposed?: { label: string };
  reason?: string;
  avatarSrc?: string;
}

export interface BookingRowActions {
  onJoin?: (b: BookingRowData) => void;
  onReschedule?: (b: BookingRowData) => void;
  onCancel?: (b: BookingRowData) => void;
  onAccept?: (b: BookingRowData) => void;
  onDecline?: (b: BookingRowData) => void;
  onAcceptNewTime?: (b: BookingRowData) => void;
  onDeclineNewTime?: (b: BookingRowData) => void;
  onWithdraw?: (b: BookingRowData) => void;
  onBookAgain?: (b: BookingRowData) => void;
  onFindAnother?: (b: BookingRowData) => void;
}

export interface BookingRowProps extends BookingRowActions {
  side: BookingSide;
  booking: BookingRowData;
}

const STATUS: Record<BookingSide, Record<BookingStatus, [string, BadgeTone]>> = {
  consulting: {
    pending: ["Awaiting response", "warning"],
    scheduled: ["Confirmed", "success"],
    reschedule: ["Reschedule", "warning"],
    completed: ["Completed", "neutral"],
    declined: ["Declined", "danger"],
    cancelled: ["Cancelled", "danger"],
  },
  expert: {
    pending: ["New request", "warning"],
    scheduled: ["Confirmed", "success"],
    reschedule: ["Reschedule", "warning"],
    completed: ["Completed", "neutral"],
    declined: ["Declined", "danger"],
    cancelled: ["Cancelled", "danger"],
  },
};

const STRIPE: Record<BookingStatus, string> = {
  pending: "border-l-warning",
  scheduled: "border-l-success",
  reschedule: "border-l-warning",
  completed: "border-l-border-hover",
  declined: "border-l-danger",
  cancelled: "border-l-danger",
};

/** "Reschedule" reads differently depending on who proposed it. */
const labelFor = (side: BookingSide, b: BookingRowData): [string, BadgeTone] =>
  b.status === "reschedule"
    ? [b.by === "them" ? "Reschedule requested" : "Reschedule sent", "warning"]
    : STATUS[side][b.status];

function Actions({ side, booking: b, ...cb }: BookingRowProps): ReactNode {
  const join = (
    <Button variant={b.soon ? "primary" : "secondary"} size="sm" onClick={() => cb.onJoin?.(b)}>
      <Icon icon={Video} size="sm" /> Join call
    </Button>
  );

  if (b.status === "reschedule")
    return b.by === "them" ? (
      <>
        <Button variant="success" size="sm" onClick={() => cb.onAcceptNewTime?.(b)}>
          <Icon icon={Check} size="sm" /> Accept new time
        </Button>
        <Button variant="secondary" size="sm" onClick={() => cb.onDeclineNewTime?.(b)}>
          Decline
        </Button>
      </>
    ) : (
      <Button variant="secondary" size="sm" onClick={() => cb.onWithdraw?.(b)}>
        Withdraw request
      </Button>
    );

  if (b.status === "scheduled")
    return (
      <>
        {join}
        <Button variant="secondary" size="sm" onClick={() => cb.onReschedule?.(b)}>
          <Icon icon={CalendarClock} size="sm" /> Reschedule
        </Button>
        <Button variant="danger-ghost" size="sm" onClick={() => cb.onCancel?.(b)}>
          Cancel
        </Button>
      </>
    );

  if (side === "expert") {
    if (b.status === "pending")
      return (
        <>
          <Button variant="success" size="sm" onClick={() => cb.onAccept?.(b)}>
            <Icon icon={Check} size="sm" /> Accept
          </Button>
          <Button variant="secondary" size="sm" onClick={() => cb.onDecline?.(b)}>
            Decline
          </Button>
        </>
      );
    return null;
  }

  if (b.status === "pending")
    return (
      <Button variant="secondary" size="sm" onClick={() => cb.onCancel?.(b)}>
        Cancel request
      </Button>
    );
  if (b.status === "completed")
    return (
      <Button variant="secondary" size="sm" onClick={() => cb.onBookAgain?.(b)}>
        Book again
      </Button>
    );
  return (
    <Button variant="secondary" size="sm" onClick={() => cb.onFindAnother?.(b)}>
      Find another expert
    </Button>
  );
}

/** Inline strip for a reschedule proposal: who proposed what, and why. The other side must accept. */
function RescheduleStrip({ b }: { b: BookingRowData }) {
  const first = b.name.split(" ")[0];
  const mine = b.by === "you";
  return (
    <div className="bg-warning-light mt-4 flex items-start gap-3 rounded-md px-4 py-3">
      <span className="text-warning mt-0.5">
        <Icon icon={CalendarClock} size="sm" />
      </span>
      <div className="text-small min-w-0">
        <p className="text-text-primary font-semibold">
          {mine ? "You proposed" : `${first} proposed`} <span className="whitespace-nowrap">{b.proposed?.label}</span>
        </p>
        <p className="text-text-secondary">
          {mine
            ? `Waiting for ${first} to accept — your original time stands until then.`
            : "Accept to move the session. If you decline, the original time stays."}
        </p>
        {b.reason && <p className="text-text-secondary mt-0.5">Reason: {b.reason}</p>}
      </div>
    </div>
  );
}

/**
 * Agenda item: one booking on a vertical timeline. Date column + line on the left, a status-striped card on the right.
 * Pay-upfront lifecycle: pending → scheduled → completed, or reschedule (the other side must accept), or
 * declined / cancelled (reason required, refund within 7 days).
 */
export function BookingRow(props: BookingRowProps) {
  const { side, booking: b } = props;
  const [label, tone] = labelFor(side, b);
  const [weekday, ...rest] = b.when.split(" · ");
  const actions = Actions(props);

  return (
    <div className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-5 [&:last-child_.tl-line]:hidden">
      <div className="flex flex-col items-center pt-1 text-center">
        <span className="text-small text-text-secondary font-semibold uppercase">{weekday}</span>
        <span className="text-heading text-text-primary leading-none font-extrabold">{b.day}</span>
        <span className="text-small text-text-secondary uppercase">{b.month}</span>
        <span className="tl-line bg-border-hover mt-3 w-px flex-1" />
      </div>
      <div className={`bg-surface-light ${STRIPE[b.status]} ring-primary/10 mb-5 rounded-lg border-l-4 p-5 shadow-sm ring-1`}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 flex-1 basis-60 items-start gap-3.5">
            <Avatar alt={b.name} src={b.avatarSrc} sizeClassName="size-11" fillClassName="font-bold" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="text-body text-text-primary font-semibold">{b.topic}</h3>
                <Badge tone={tone} size="sm">
                  {label}
                </Badge>
              </div>
              <p className="text-small text-text-secondary mt-1">
                with <span className="text-text-primary font-medium">{b.name}</span> · {rest.join(" · ")}
              </p>
              <p className="text-small text-text-secondary">{b.detail}</p>
              {b.refund && (
                <p className="text-small text-success mt-1 flex items-start gap-1.5 font-medium">
                  <Icon icon={RotateCcw} size="sm" className="mt-0.5 size-3.5!" />
                  <span>{b.refund}</span>
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {b.status === "reschedule" && b.proposed && <RescheduleStrip b={b} />}
      </div>
    </div>
  );
}
