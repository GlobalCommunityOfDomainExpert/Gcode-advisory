import { randomBytes } from "node:crypto";
import { CashfreeError, cashfree, toMinor, type Cashfree } from "./cashfree";
import { siteOrigin } from "./env";
import { ords, type OrdsResult } from "./ords";
import type { PaymentOrder, PayoutAccount } from "@/lib/booking/types";

/**
 * The Next server's side of money (db/S3-02: payments, db/P3-02: payouts). The database never calls a gateway: this file does,
 * then tells the database what happened with PAYMENT_SERVER_KEY. Every function takes its two collaborators (the gateway and the
 * backend call) so the tests need neither a network nor a database.
 *
 *   startPayment    booker presses Pay: get the order details from the database, create the order at Cashfree, keep it.
 *   verifyOrder     ask Cashfree what happened to one order, tell the database. Used by the return page and by reconcile.
 *   handleWebhook   Cashfree calls us: check the signature on the raw body, tell the database.
 *   reconcile       orders still open that nobody reported on (closed tab, late webhook).
 *   processRefunds  create or check each queued refund at Cashfree, report the result. Retries and backoff live in the database.
 *   processPayouts  create or check each queued expert payout, report the result.
 */

export type ServerApi = <T>(path: string, body?: unknown, method?: "GET" | "POST") => Promise<OrdsResult<T>>;

/** The default backend call: ORDS with the payment server key. */
export function serverApi(): ServerApi {
  return (path, body, method) => {
    const key = process.env.PAYMENT_SERVER_KEY;
    if (!key) return Promise.resolve({ ok: false, status: 503, message: "PAYMENT_SERVER_KEY is not set" } as const);
    return ords(path, { method: method ?? (body === undefined ? "GET" : "POST"), body, headers: { "X-Server-Key": key } });
  };
}

interface Intent extends Partial<PaymentOrder> {
  needsOrder?: boolean;
  orderId: string;
  bookingId: number;
  amountMinor: number;
  expiresAt: string | null;
  customer?: { id: string; name: string; email: string; phone: string };
}

/** The order id is GCB<booking>N<attempt>: the booking can be read from it, and only digits and letters. */
export const ORDER_ID = /^GCB(\d{1,18})N(\d{1,3})$/;
export const bookingOfOrder = (orderId: string): string | null => ORDER_ID.exec(orderId)?.[1] ?? null;

export type StartResult = { ok: true; data: PaymentOrder & { checkoutMode?: "sandbox" | "production" } } | Extract<OrdsResult<never>, { ok: false }>;

/** POST /api/booking/:id/pay. With the STUB gateway the database does everything; with Cashfree this creates the order. */
export async function startPayment(token: string, bookingId: string, cf: Cashfree | null = cashfree(), api: ServerApi = serverApi(), origin = siteOrigin(), call = ords): Promise<StartResult> {
  const first = await call<Intent | PaymentOrder>(`/bookings/${bookingId}/pay`, { method: "POST", body: {}, token });
  if (!first.ok) return first;
  const data = first.data as Intent;
  if (!data.needsOrder) {
    const order = first.data as PaymentOrder;
    return { ok: true, data: { ...order, checkoutMode: cf?.env } };
  }
  if (!cf || !data.customer) return { ok: false, status: 409, message: "Payments are not available yet" };

  let session: string;
  try {
    const hold = data.expiresAt ? Date.parse(data.expiresAt) : Date.now();
    // the gateway wants an order to live at least 15 minutes; a payment that lands after our hold is refunded by the database
    const expiresAt = new Date(Math.max(hold + 2 * 60_000, Date.now() + 16 * 60_000));
    try {
      const created = await cf.createOrder({
        orderId: data.orderId,
        amountMinor: data.amountMinor,
        customer: data.customer,
        returnUrl: `${origin}/book/return?order_id={order_id}`,
        notifyUrl: origin.startsWith("https://") ? `${origin}/api/webhooks/cashfree` : undefined,
        expiresAt,
      });
      session = created.paymentSessionId;
    } catch (e) {
      // we created it before but failed to save it: the order exists, take its session
      if (e instanceof CashfreeError && e.kind === "api" && (e.status === 409 || e.code === "order_already_exists")) {
        session = (await cf.getOrderSession(data.orderId)).paymentSessionId;
      } else {
        throw e;
      }
    }
  } catch (e) {
    // the reason for the operator's log (never for the user): Cashfree's status, code and message. No keys, no card data.
    console.error("startPayment: Cashfree order failed", { bookingId, orderId: data.orderId, env: cf.env, error: e instanceof CashfreeError ? { kind: e.kind, status: e.status, code: e.code, message: e.message } : String(e) });
    return { ok: false, status: 502, message: "We couldn’t start the payment. Please try again." };
  }

  const saved = await api<PaymentOrder>("/payments/orders", { bookingId: bookingId, orderId: data.orderId, sessionId: session });
  return saved.ok ? { ok: true, data: { ...saved.data, checkoutMode: cf.env } } : saved;
}

interface EventArgs {
  gateway: "CASHFREE";
  eventId: string;
  orderId: string;
  type: string;
  payload: string;
  sigOk: "Y" | "N";
  status: string | null;
  paymentId: string | null;
  amountMinor: number | null;
  refundRef?: string | null;
  error?: string | null;
}

export type EventResult = "OK" | "DUPLICATE" | "IGNORED" | "MISMATCH" | "ERROR";

async function report(api: ServerApi, e: EventArgs): Promise<OrdsResult<{ result: EventResult }>> {
  return api<{ result: EventResult }>("/payments/events", e);
}

/**
 * Asks Cashfree what became of one order and tells the database. The signature is "Y" because WE fetched the status from
 * Cashfree over TLS with our own credentials: nothing from the browser is believed.
 */
export async function verifyOrder(orderId: string, cf: Cashfree, api: ServerApi = serverApi()): Promise<"PAID" | "FAILED" | "PENDING" | "EXPIRED" | "ERROR"> {
  if (!ORDER_ID.test(orderId)) return "ERROR";
  let outcome;
  try {
    outcome = await cf.orderOutcome(orderId);
  } catch {
    return "ERROR";
  }
  if (outcome.status === "PENDING" || outcome.status === "EXPIRED") return outcome.status;
  const res = await report(api, {
    gateway: "CASHFREE",
    eventId: `RECON|${orderId}|${outcome.status}|${outcome.paymentId ?? "none"}`,
    orderId,
    type: `RECONCILE_${outcome.status}`,
    payload: JSON.stringify(outcome),
    sigOk: "Y",
    status: outcome.status === "PAID" ? "SUCCESS" : "FAILED",
    paymentId: outcome.paymentId,
    amountMinor: outcome.amountMinor,
  });
  return res.ok && res.data.result !== "ERROR" ? outcome.status : "ERROR";
}

/** Orders still open that nobody has reported on: ask the gateway about each. */
export async function reconcile(cf: Cashfree, api: ServerApi = serverApi()): Promise<{ checked: number; paid: number }> {
  const list = await api<{ orderId: string }[]>("/payments/orders/pending");
  if (!list.ok) return { checked: 0, paid: 0 };
  let paid = 0;
  for (const o of list.data) {
    if ((await verifyOrder(o.orderId, cf, api)) === "PAID") paid += 1;
  }
  return { checked: list.data.length, paid };
}

interface WebhookBody {
  type?: string;
  event_time?: string;
  data?: {
    order?: { order_id?: string };
    payment?: { cf_payment_id?: string | number; payment_status?: string; payment_amount?: number | string };
    refund?: { cf_refund_id?: string | number; refund_id?: string; order_id?: string; refund_status?: string; status_description?: string };
  };
}

/**
 * Cashfree's call to us. `verified` is the result of checking the signature on the RAW body; this function never sees a secret.
 * Returns the HTTP status to answer with: 200 when the database has it (even if it is a duplicate or was ignored), 400 for
 * something that is not a webhook, 503 when the database could not be reached (Cashfree will deliver it again).
 */
export async function handleWebhook(rawBody: string, verified: boolean, api: ServerApi = serverApi()): Promise<number> {
  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return 400;
  }
  const type = typeof body.type === "string" ? body.type.slice(0, 60) : "";
  const refund = body.data?.refund;
  const payment = body.data?.payment;
  const orderId = String(body.data?.order?.order_id ?? refund?.order_id ?? "");
  if (!type || !ORDER_ID.test(orderId)) return 400;
  const stamp = String(body.event_time ?? "");

  let args: EventArgs;
  if (refund && /^GCR\d{1,12}$/.test(String(refund.refund_id ?? ""))) {
    const s = String(refund.refund_status ?? "").toUpperCase();
    args = {
      gateway: "CASHFREE",
      eventId: `${type}|${refund.cf_refund_id ?? refund.refund_id}|${s}|${stamp}`,
      orderId,
      type,
      payload: rawBody,
      sigOk: verified ? "Y" : "N",
      status: s === "SUCCESS" ? "SUCCESS" : s === "CANCELLED" ? "CANCELLED" : s === "FAILED" ? "ERROR" : "PENDING",
      paymentId: refund.cf_refund_id != null ? String(refund.cf_refund_id) : null,
      amountMinor: null,
      refundRef: refund.refund_id,
      error: refund.status_description ?? null,
    };
  } else if (payment && type.startsWith("PAYMENT_")) {
    args = {
      gateway: "CASHFREE",
      eventId: `${type}|${payment.cf_payment_id ?? "none"}|${stamp}`,
      orderId,
      type,
      payload: rawBody,
      sigOk: verified ? "Y" : "N",
      status: String(payment.payment_status ?? ""),
      paymentId: payment.cf_payment_id != null ? String(payment.cf_payment_id) : null,
      amountMinor: payment.payment_amount != null ? toMinor(payment.payment_amount) : null,
    };
  } else {
    return 200; // a kind of event we do not use
  }
  // an unsigned call is still logged (as ignored) so someone probing the endpoint leaves a trace
  const res = await report(api, args);
  return res.ok ? 200 : 503;
}

interface PendingRefund {
  refundId: number;
  refundKey: string;
  orderId: string;
  amountMinor: number;
  reason: string;
  mode: "create" | "check";
}

/** Create or check each queued refund at Cashfree and report. The refund id (GCR<id>) is ours and never changes. */
export async function processRefunds(cf: Cashfree, api: ServerApi = serverApi()): Promise<{ queued: number; credited: number }> {
  const list = await api<PendingRefund[]>("/payments/refunds/pending");
  if (!list.ok) return { queued: 0, credited: 0 };
  let credited = 0;
  for (const r of list.data) {
    let status: "SUCCESS" | "PENDING" | "CANCELLED" | "ERROR" = "ERROR";
    let ref: string | null = null;
    let error: string | null = null;
    try {
      let res;
      try {
        res = r.mode === "check" ? await cf.getRefund(r.orderId, r.refundKey) : await cf.createRefund({ orderId: r.orderId, refundId: r.refundKey, amountMinor: r.amountMinor, note: r.reason });
      } catch (e) {
        // "create" that the gateway rejects may be one it already has (we asked, then lost the answer): look before giving up
        if (r.mode === "create" && e instanceof CashfreeError && e.kind === "api" && (e.status === 400 || e.status === 409)) {
          try {
            res = await cf.getRefund(r.orderId, r.refundKey);
          } catch {
            throw e;
          }
        } else {
          throw e;
        }
      }
      ref = res.cfRefundId;
      status = res.status === "SUCCESS" ? "SUCCESS" : res.status === "CANCELLED" ? "CANCELLED" : "PENDING";
    } catch (e) {
      error = e instanceof Error ? e.message.slice(0, 300) : "refund call failed";
    }
    const saved = await api(`/payments/refunds/${r.refundId}/report`, { status, gatewayRefundId: ref, error });
    if (saved.ok && status === "SUCCESS") credited += 1;
  }
  return { queued: list.data.length, credited };
}

interface PendingPayout {
  payoutId: number;
  transferKey: string;
  amountMinor: number;
  mode: "create" | "check";
  method?: "UPI" | "BANK";
  beneficiaryId?: string;
}

/** Create or check each queued payout. Without payout credentials nothing is sent: an operator pays by hand (db/P3-02). */
export async function processPayouts(cf: Cashfree, api: ServerApi = serverApi()): Promise<{ queued: number; paid: number; skipped?: true }> {
  if (!cf.hasPayouts) return { queued: 0, paid: 0, skipped: true };
  const list = await api<PendingPayout[]>("/payouts/pending");
  if (!list.ok) return { queued: 0, paid: 0 };
  let paid = 0;
  for (const p of list.data) {
    let status: "SUCCESS" | "PENDING" | "FAILED" | "ERROR" = "ERROR";
    let gatewayRef: string | null = null;
    let utr: string | null = null;
    let error: string | null = null;
    try {
      let res;
      try {
        res =
          p.mode === "check" || !p.method || !p.beneficiaryId
            ? await cf.getTransfer(p.transferKey)
            : await cf.createTransfer({
                transferId: p.transferKey,
                amountMinor: p.amountMinor,
                beneficiaryId: p.beneficiaryId,
                method: p.method,
              });
      } catch (e) {
        if (p.mode === "create" && e instanceof CashfreeError && e.kind === "api" && (e.status === 400 || e.status === 409)) {
          try {
            res = await cf.getTransfer(p.transferKey); // already created before: take its state
          } catch {
            throw e;
          }
        } else {
          throw e;
        }
      }
      status = res.status;
      gatewayRef = res.gatewayRef;
      utr = res.utr;
      error = res.error;
    } catch (e) {
      error = e instanceof Error ? e.message.slice(0, 300) : "transfer call failed";
    }
    const saved = await api(`/payouts/${p.payoutId}/report`, { status, gatewayRef, utr, error });
    if (saved.ok && status === "SUCCESS") paid += 1;
  }
  return { queued: list.data.length, paid };
}

export interface PayoutAccountInput {
  method: "UPI" | "BANK";
  holderName: string;
  upiId?: string;
  accountNo?: string;
  ifsc?: string;
}

const fail = (status: number, message: string) => ({ ok: false, status, message }) as const;

/** "asha@okbank" -> "as***@okbank". Enough for the owner to recognise it, useless to anyone else. */
export const maskUpi = (upi: string): string => {
  const [name, handle] = upi.split("@");
  return `${name.slice(0, 2)}***@${handle}`;
};

/**
 * PUT /api/payout/account. The full account number / UPI id is checked here, sent to Cashfree to make a beneficiary, and then
 * dropped: the database is told only the beneficiary id and a masked label. Nothing is saved unless Cashfree accepted it.
 */
export async function savePayoutAccount(
  who: { token: string; email?: string },
  input: PayoutAccountInput,
  cf: Cashfree | null = cashfree(),
  call = ords,
  key = process.env.PAYMENT_SERVER_KEY,
): Promise<OrdsResult<PayoutAccount>> {
  const holderName = input.holderName.trim();
  if (holderName.length < 2 || holderName.length > 120) return fail(400, "Enter the account holder's name");
  let upiId: string | undefined;
  let accountNo: string | undefined;
  let ifsc: string | undefined;
  if (input.method === "UPI") {
    upiId = (input.upiId ?? "").trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,50}@[a-z]{2,30}$/.test(upiId)) return fail(400, "That UPI id does not look right. It looks like name@bank");
  } else {
    accountNo = (input.accountNo ?? "").replace(/[ -]/g, "");
    ifsc = (input.ifsc ?? "").trim().toUpperCase();
    if (!/^[0-9]{9,18}$/.test(accountNo)) return fail(400, "The account number should be 9 to 18 digits");
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) return fail(400, "The IFSC code looks like HDFC0001234");
  }
  if (!cf || !cf.hasPayouts) return fail(503, "Payout accounts cannot be saved yet. Please try again later.");

  // a new random id for every save, so a changed account is a new beneficiary and the old one keeps serving any payout already queued
  const beneficiaryId = `GCU${randomBytes(10).toString("hex")}`;
  try {
    await cf.createBeneficiary({ beneficiaryId, method: input.method, holderName, upiId, accountNo, ifsc, email: who.email });
  } catch (e) {
    if (e instanceof CashfreeError && e.kind === "api" && (e.status === 400 || e.status === 422)) {
      return fail(400, "Your bank or UPI details were not accepted. Check them and try again.");
    }
    // 401/403 (our keys or IP not allowed), 404, 5xx or no answer: our side or theirs, never the expert's typing
    return fail(502, "We could not reach our payment partner. Please try again.");
  }
  const masked =
    input.method === "UPI"
      ? { method: "UPI", holderName, beneficiaryId, upiMasked: maskUpi(upiId as string) }
      : { method: "BANK", holderName, beneficiaryId, accountLast4: (accountNo as string).slice(-4), ifsc };
  if (!key) return fail(503, "Payout accounts cannot be saved yet. Please try again later.");
  return call<PayoutAccount>("/payouts/account", { method: "PUT", body: masked, token: who.token, headers: { "X-Server-Key": key } });
}

/** Everything the scheduler runs, one after the other. Safe to call as often as every few minutes. */
export async function runPaymentJobs(cf: Cashfree | null = cashfree(), api: ServerApi = serverApi()) {
  if (!cf) return { configured: false as const };
  const orders = await reconcile(cf, api);
  const refunds = await processRefunds(cf, api);
  const payouts = await processPayouts(cf, api);
  return { configured: true as const, orders, refunds, payouts };
}
