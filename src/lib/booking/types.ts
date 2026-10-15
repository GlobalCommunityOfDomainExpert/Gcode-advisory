/** Shapes the booking backend returns (db/S3-02-packages.sql). Money is in paise. Times are ISO instants in UTC ("...Z"). */

/** PAID_SOON: set up paid sessions only, and payments are not switched on yet. */
export type ExpertStatus = "BOOKABLE" | "COMMUNITY" | "NO_SERVICE" | "PAID_SOON";

export interface ExpertCard {
  /** 39-digit id: always text. */
  userId: string;
  /** The public address: /experts/<slug>. */
  slug: string;
  name: string;
  photoUrl: string | null;
  headline: string | null;
  location: string | null;
  bio: string | null;
  bookable: boolean;
  /** What the expert chose on their profile: paid sessions, free sessions, or community member. */
  engagement: "PROVIDER" | "COMMUNITY" | null;
  status: ExpertStatus;
  skills: string[];
  domains: string[];
  /** Only for bookable experts. 0 means the cheapest service is free. */
  fromPriceMinor?: number;
  nextSlotAt?: string | null;
  /** Absent until the expert has at least one rating (no stars at zero). */
  rating?: { average: number; count: number };
}

export type DirectorySort = "relevance" | "rating" | "price";

/** GET directory/filters: what the filter menus offer, each with how many published experts have it. */
export interface DirectoryFilters {
  expertise: { value: string; count: number }[];
  locations: { value: string; count: number }[];
  /** The kinds of session experts offer, each with how many experts offer it. */
  services: { value: string; count: number }[];
  /** The dearest session on offer, in paise (0 while everything is free). */
  maxPriceMinor: number;
  /** false while only free sessions can be booked: there is no price to filter by. */
  paymentsEnabled: boolean;
}

export interface DirectoryList {
  items: ExpertCard[];
  hasMore: boolean;
  /** Everyone who matches the search and filters, not just this page. */
  total: number;
  /** How many of them can be booked now. */
  bookable: number;
  /** false while only free sessions can be booked. */
  paymentsEnabled: boolean;
}

export interface BookableService {
  id: number;
  title: string;
  description: string | null;
  durationMin: number;
  bufferMin: number;
  priceMinor: number;
  nextSlotAt: string | null;
}

export interface ExpertPage extends ExpertCard {
  services: BookableService[];
  paymentsEnabled: boolean;
}

/** One rating a person received. The reviewer is a first name and last initial ("Local E."). */
export interface Review {
  stars: number;
  comment: string | null;
  from: string;
  createdAt: string;
}

/** GET bookings/reviews: the public ratings the signed-in expert has received (always empty for a booker). */
export interface ReviewSummary {
  count: number;
  average?: number;
  items: Review[];
}

/** GET directory/public/:slug: everything the public page shows. No email, phone or token. */
export interface PublicExpert extends ExpertPage {
  pitch: string | null;
  /** The latest ratings, only when there is at least one. */
  reviews?: Review[];
  career: { title: string; org: string | null; period: string | null; desc: string | null }[];
  education: { institution: string; degree: string | null; period: string | null }[];
}

export interface Slot {
  startAt: string;
  endAt: string;
}

export interface DayCount {
  /** YYYY-MM-DD, an IST calendar day. */
  day: string;
  count: number;
}

export interface NextDay {
  day: string;
  firstSlot: string;
}

export type BookingStatus = "PENDING_PAYMENT" | "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | "DECLINED" | "EXPIRED" | "ABANDONED";

export interface BookingView {
  id: number;
  /** The service this was booked from: the time picker for a new time reads its open slots. */
  serviceId?: number | null;
  status: BookingStatus;
  /** The signed-in user's side of this booking. */
  role: "requester" | "expert";
  requesterId: string;
  requesterName: string;
  expertId: string;
  expertName: string;
  serviceTitle: string;
  durationMin: number;
  priceMinor: number;
  feePct: number;
  startAt: string;
  endAt: string;
  note: string | null;
  expiresAt: string | null;
  paymentRequired: boolean;
  cancelledBy: string | null;
  reason: string | null;
  reasonLabel: string | null;
  reasonNote: string | null;
  /** Set when a confirmed session is settled: who turned up. */
  outcome: BookingOutcome | null;
  /** The call link /call/<callSlug>, only while the session is confirmed. */
  callSlug?: string;
  /** The booker only: a payment was made for this booking (so there is a receipt). */
  paid?: boolean;
  /** The booker only: the money coming back. DONE once it has been sent. */
  refund?: { status: "IN_PROGRESS" | "DONE"; amountMinor: number; dueBy: string };
  /** The session was moved to a new time that both agreed (S10). */
  rescheduled?: boolean;
  /** A new time somebody suggested, still waiting for an answer. The original time stands until it is accepted. */
  reschedule?: RescheduleProposal;
  /** The rating this person gave the other one. */
  rating?: BookingRating;
  /** Experts only: the rating the booker gave them. A booker never sees what an expert said about them (it is internal). */
  receivedRating?: BookingRating;
  /** This person's own report about the session, with support's decision once there is one. */
  report?: ProblemReport;
  createdAt: string;
  /** What this person may do right now. The screens show exactly these buttons. */
  actions: BookingAction[];
}

export interface RescheduleProposal {
  id: number;
  /** The signed-in person suggested it (so they can only withdraw it). */
  byMe: boolean;
  byName: string;
  startAt: string;
  endAt: string;
  reason: string;
  reasonLabel: string | null;
  note: string | null;
  createdAt: string;
}

export interface BookingRating {
  stars: number;
  comment: string | null;
  createdAt: string;
}

export type ReportType = "NO_SHOW" | "DROPPED_CALL" | "NOT_AS_DESCRIBED" | "OTHER";
export type ReportStatus = "OPEN" | "REFUNDED" | "REJECTED";

export interface ProblemReport {
  type: ReportType;
  status: ReportStatus;
  /** Support's note once decided. */
  note?: string | null;
  createdAt: string;
}

export const REPORT_TYPES: { value: ReportType; label: string; hint: string }[] = [
  { value: "NO_SHOW", label: "The other person didn’t show up", hint: "Report this once 10 minutes of the session have passed." },
  { value: "DROPPED_CALL", label: "The call dropped or didn’t work", hint: "Audio or video failed for a large part of the session." },
  { value: "NOT_AS_DESCRIBED", label: "The session was not as described", hint: "What happened was very different from the service." },
  { value: "OTHER", label: "Something else", hint: "Tell us what happened." },
];

export type BookingOutcome = "ATTENDED" | "EXPERT_NO_SHOW" | "REQUESTER_NO_SHOW" | "BOTH_NO_SHOW";
export type BookingAction = "accept" | "decline" | "cancel" | "join" | "rate" | "report" | "reschedule" | "reschedule_accept" | "reschedule_decline" | "reschedule_withdraw";
export type BookingTab = "upcoming" | "completed" | "cancelled";
export const BOOKING_TABS: BookingTab[] = ["upcoming", "completed", "cancelled"];

export interface BookingList {
  items: BookingView[];
  counts: Record<BookingTab, number>;
  tab: BookingTab;
  /** There is a next page (25 bookings a page). */
  hasMore?: boolean;
}

/** One line of the decline / cancel pick list. */
export interface BookingReason {
  action: "decline" | "cancel" | "reschedule";
  actor: "expert" | "requester";
  code: string;
  label: string;
  needsNote: boolean;
}

export interface PaymentOrder {
  orderId: string;
  bookingId: number;
  gateway: "STUB" | "CASHFREE";
  /** Cashfree only: which checkout to open. */
  checkoutMode?: "sandbox" | "production";
  amountMinor: number;
  currency: string;
  status: "CREATED" | "PAID" | "FAILED" | "EXPIRED";
  paymentSessionId: string | null;
  expiresAt: string | null;
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "Waiting for payment",
  PENDING: "Waiting for the expert",
  SCHEDULED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  ABANDONED: "Not paid",
};

/** POST /bookings/:id/extend and GET /bookings/call/:slug/clock: the session's current end (db/E1-01-extend.sql). */
export interface CallClockInfo {
  endAt: string;
  /** Minutes the expert has added so far (0, 15 or 30). */
  extendedMin: number;
  /** This person is the expert and may add 15 more minutes right now. */
  canExtend: boolean;
}

/** GET /bookings/:id/join: whether the call is open for this person (db/F2-01-meeting.sql). `url` only for the LOCAL provider. */
export interface JoinInfo {
  bookingId: number;
  slug: string;
  role: "expert" | "requester";
  state: "EARLY" | "OPEN" | "ENDED";
  serviceTitle: string;
  otherName: string;
  startAt: string;
  endAt: string;
  opensAt: string;
  closesAt: string;
  provider: "LOCAL" | "ZOHO";
  /** The booking is already COMPLETED (attendance settled). */
  settled?: boolean;
  roomReady?: boolean;
  needsRoom?: boolean;
  room?: string;
  url?: string;
}

/** GET bookings/:id/receipt (db/S3-02 receipt_json). The expert's copy has `earning` and no `refund` shown to the booker's eyes. */
export interface Receipt {
  receiptNo: string;
  bookingId: number;
  role: "requester" | "expert";
  serviceTitle: string;
  durationMin: number;
  startAt: string;
  expertName: string;
  requesterName: string;
  amountMinor: number;
  currency: string;
  paidAt: string;
  gateway: "STUB" | "CASHFREE";
  paymentRef: string | null;
  bookingStatus: BookingStatus;
  /** PAID, REFUND_PENDING (money on its way back) or REFUNDED. */
  status: "PAID" | "REFUND_PENDING" | "REFUNDED";
  refund?: { amountMinor: number; status: "IN_PROGRESS" | "DONE"; reason: string; reasonLabel: string; dueBy: string; creditedAt: string | null };
  earning?: { feePct: number; feeMinor: number; netMinor: number; settlement: "HELD" | "RELEASED" | "REFUNDED"; releasesOn?: string; holdDays?: number };
}

/** GET payouts/account. The account number never comes back in full. */
export interface PayoutAccount {
  hasAccount: boolean;
  paymentsEnabled: boolean;
  method?: "UPI" | "BANK";
  holderName?: string;
  /** The UPI id with the middle hidden, e.g. as***@okbank. The full id is held by the payment partner, not by us. */
  upiMasked?: string | null;
  accountLast4?: string | null;
  ifsc?: string | null;
}

/** pending = in escrow until the session happens and for a week after it, available = released and not yet sent, paid = covered by a payout. */
export type EarningStatus = "pending" | "available" | "paid";

export interface EarningRow {
  bookingId: number;
  startAt: string;
  serviceTitle: string;
  requesterName: string;
  grossMinor: number;
  feeMinor: number;
  netMinor: number;
  status: EarningStatus;
  /** For a completed session still in escrow: when it is released (one week after the session). */
  releasesOn?: string;
}

export type PayoutStatus = "REQUESTED" | "PROCESSING" | "PAID" | "FAILED";

/** GET payouts/earnings. */
export interface Earnings {
  paymentsEnabled: boolean;
  hasAccount: boolean;
  /** Earned, not yet sent, and not in an open payout. */
  availableMinor: number;
  /** In a payout that has been made but has not arrived. */
  onTheWayMinor: number;
  /** Held for sessions that have not happened yet, after our fee. */
  upcomingMinor: number;
  paidOutMinor: number;
  /** Everything ever released to this expert, after the fee. */
  lifetimeNetMinor: number;
  minPayoutMinor: number;
  /** YYYY-MM-DD, the next Monday. */
  nextBatchOn: string;
  /** Newest first, the last 50 sessions that earned money. Refunded sessions are not listed. */
  sessions: EarningRow[];
  payouts: { id: number; ref: string; amountMinor: number; status: PayoutStatus; to: string; createdAt: string; paidAt: string | null; utr: string | null; note: string | null }[];
}
