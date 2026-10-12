import { createHmac, publicEncrypt, timingSafeEqual } from "node:crypto";

/**
 * Cashfree client, server only. Two products with separate credentials:
 *  - Payment Gateway (PG): orders, payments, refunds. CASHFREE_APP_ID + CASHFREE_SECRET_KEY.
 *  - Payouts: transfers to experts. CASHFREE_PAYOUT_CLIENT_ID + CASHFREE_PAYOUT_CLIENT_SECRET (optional: without them
 *    payouts are made by hand, see db/P3-02-payout-api.sql).
 * Secrets come from the environment and never reach the browser or the database. Everything takes an injectable fetch so the
 * tests need no network. Money is paise inside our code and rupees on the wire.
 */

export type CashfreeErrorKind = "not_configured" | "api" | "network";

export class CashfreeError extends Error {
  constructor(
    readonly kind: CashfreeErrorKind,
    message: string,
    readonly status?: number,
    /** Cashfree's own error code, e.g. "refund_id_already_exists". Useful for matching, never shown to a user. */
    readonly code?: string,
  ) {
    super(message);
    this.name = "CashfreeError";
  }
}

export interface CashfreeConfig {
  env: "sandbox" | "production";
  appId: string;
  secretKey: string;
  /** Payouts are optional. */
  payout?: { clientId: string; clientSecret: string; /** PEM public key from Payouts > Developers > Two-Factor Authentication. Signs each call instead of an IP allow-list (for hosts without a fixed IP). */ publicKey?: string };
  /** LOCAL TESTING ONLY: a stand-in server (local-stack/mock-cashfree.mjs). Ignored in production mode and when NODE_ENV is production. */
  apiBase?: string;
}

/** A PEM from an env var: real newlines or the two characters \n (most hosts keep a PEM on one line). */
function pemFrom(v: string | undefined): string | undefined {
  const t = v?.trim().replace(/\\n/g, "\n");
  return t && t.includes("BEGIN") ? t : undefined;
}

/** X-Cf-Signature: base64(RSA-OAEP(publicKey, "<clientId>.<unix seconds>")). Cashfree accepts it for 5 minutes. */
export function payoutSignature(clientId: string, publicKey: string, nowMs = Date.now()): string {
  return publicEncrypt(publicKey, Buffer.from(`${clientId}.${Math.floor(nowMs / 1000)}`)).toString("base64");
}

export function cashfreeConfig(env: Record<string, string | undefined> = process.env): CashfreeConfig | null {
  const appId = env.CASHFREE_APP_ID?.trim();
  const secretKey = env.CASHFREE_SECRET_KEY?.trim();
  if (!appId || !secretKey) return null;
  const payoutId = env.CASHFREE_PAYOUT_CLIENT_ID?.trim();
  const payoutSecret = env.CASHFREE_PAYOUT_CLIENT_SECRET?.trim();
  const mode = env.CASHFREE_ENV?.trim().toLowerCase() === "production" ? "production" : "sandbox";
  const base = env.CASHFREE_API_BASE?.trim().replace(/\/+$/, "");
  return {
    env: mode,
    apiBase: mode === "sandbox" && env.NODE_ENV !== "production" && base && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base) ? base : undefined,
    appId,
    secretKey,
    payout: payoutId && payoutSecret ? { clientId: payoutId, clientSecret: payoutSecret, publicKey: pemFrom(env.CASHFREE_PAYOUT_PUBLIC_KEY) } : undefined,
  };
}

const PG_VERSION = "2023-08-01";
const PAYOUT_VERSION = "2024-01-01";

/** Paise to the rupee amount Cashfree wants (a number with at most 2 decimals). */
export const toRupees = (minor: number): number => Math.round(minor) / 100;
/** Rupees from Cashfree back to paise, without float drift. */
export const toMinor = (rupees: number | string): number => Math.round(Number(rupees) * 100);

export interface OrderCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface CreatedOrder {
  orderId: string;
  paymentSessionId: string;
}

export type OrderStatus = "PAID" | "FAILED" | "PENDING" | "EXPIRED";

/** What we learned about an order from the gateway: the verdict, and the payment that decided it. */
export interface OrderOutcome {
  status: OrderStatus;
  paymentId: string | null;
  amountMinor: number | null;
}

export type RefundState = "SUCCESS" | "PENDING" | "CANCELLED" | "ONHOLD";

export interface RefundResult {
  refundId: string;
  cfRefundId: string | null;
  status: RefundState;
}

export type TransferState = "SUCCESS" | "PENDING" | "FAILED";

export interface TransferResult {
  status: TransferState;
  gatewayRef: string | null;
  utr: string | null;
  error: string | null;
}

/** Where a payout goes, as the user typed it. Sent to Cashfree once to make a beneficiary; never stored by us. */
export interface BeneficiaryInput {
  beneficiaryId: string;
  method: "UPI" | "BANK";
  holderName: string;
  upiId?: string | null;
  accountNo?: string | null;
  ifsc?: string | null;
  email?: string | null;
  phone?: string | null;
}

type Json = Record<string, unknown>;

export function createCashfree(cfg: CashfreeConfig, fetchImpl: typeof fetch = fetch) {
  const host = cfg.env === "production" ? "https://api.cashfree.com" : (cfg.apiBase ?? "https://sandbox.cashfree.com");
  const pgBase = `${host}/pg`;
  const payoutBase = `${host}/payout`;

  async function call(url: string, init: { method: string; headers: Record<string, string>; body?: unknown }): Promise<Json> {
    let res: Response;
    try {
      res = await fetchImpl(url, {
        method: init.method,
        headers: { Accept: "application/json", "Content-Type": "application/json", ...init.headers },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new CashfreeError("network", "Cashfree could not be reached");
    }
    const text = await res.text();
    let data: Json = {};
    try {
      data = text ? (JSON.parse(text) as Json) : {};
    } catch {
      /* not JSON */
    }
    if (!res.ok) {
      const code = typeof data.code === "string" ? data.code : typeof data.type === "string" ? data.type : undefined;
      const message = typeof data.message === "string" ? data.message : `Cashfree answered ${res.status}`;
      throw new CashfreeError("api", message, res.status, code);
    }
    return data;
  }

  const pg = (method: string, path: string, body?: unknown) =>
    call(`${pgBase}${path}`, { method, body, headers: { "x-client-id": cfg.appId, "x-client-secret": cfg.secretKey, "x-api-version": PG_VERSION } });

  function payoutCall(method: string, path: string, body?: unknown) {
    if (!cfg.payout) throw new CashfreeError("not_configured", "Cashfree payouts are not configured");
    return call(`${payoutBase}${path}`, {
      method,
      body,
      headers: {
        "x-client-id": cfg.payout.clientId,
        "x-client-secret": cfg.payout.clientSecret,
        "x-api-version": PAYOUT_VERSION,
        ...(cfg.payout.publicKey ? { "x-cf-signature": payoutSignature(cfg.payout.clientId, cfg.payout.publicKey) } : {}),
      },
    });
  }

  return {
    env: cfg.env,
    hasPayouts: !!cfg.payout,

    /** Creates the order the customer will pay. The expiry is the end of our hold plus a little (the gateway wants 15+ minutes). */
    async createOrder(o: { orderId: string; amountMinor: number; customer: OrderCustomer; returnUrl: string; notifyUrl?: string; expiresAt: Date; note?: string }): Promise<CreatedOrder> {
      const data = await pg("POST", "/orders", {
        order_id: o.orderId,
        order_amount: toRupees(o.amountMinor),
        order_currency: "INR",
        customer_details: { customer_id: o.customer.id, customer_name: o.customer.name, customer_email: o.customer.email, customer_phone: o.customer.phone },
        order_meta: { return_url: o.returnUrl, ...(o.notifyUrl ? { notify_url: o.notifyUrl } : {}) },
        order_expiry_time: o.expiresAt.toISOString(),
        order_note: o.note ?? "GCODE session",
      });
      const session = data.payment_session_id;
      if (typeof session !== "string" || !session) throw new CashfreeError("api", "Cashfree did not return a payment session");
      return { orderId: String(data.order_id ?? o.orderId), paymentSessionId: session };
    },

    /** An order that already exists (we created it, then failed to save it): its payment session again. */
    async getOrderSession(orderId: string): Promise<CreatedOrder> {
      const data = await pg("GET", `/orders/${encodeURIComponent(orderId)}`);
      const session = data.payment_session_id;
      if (typeof session !== "string" || !session) throw new CashfreeError("api", "Cashfree did not return a payment session");
      return { orderId, paymentSessionId: session };
    },

    /**
     * The truth about an order, from the gateway itself (never from the browser). A SUCCESS payment means PAID; otherwise
     * an expired order is EXPIRED, an order whose every attempt failed or was dropped is FAILED, anything else is PENDING.
     */
    async orderOutcome(orderId: string): Promise<OrderOutcome> {
      const order = await pg("GET", `/orders/${encodeURIComponent(orderId)}`);
      const payments = (await pg("GET", `/orders/${encodeURIComponent(orderId)}/payments`)) as unknown as Json[] | Json;
      const list = (Array.isArray(payments) ? payments : []) as Json[];
      const ok = list.find((p) => p.payment_status === "SUCCESS");
      if (ok) return { status: "PAID", paymentId: String(ok.cf_payment_id ?? ""), amountMinor: toMinor(ok.payment_amount as number) };
      if (order.order_status === "PAID") return { status: "PAID", paymentId: null, amountMinor: toMinor(order.order_amount as number) };
      if (order.order_status === "EXPIRED") return { status: "EXPIRED", paymentId: null, amountMinor: null };
      const last = list[list.length - 1];
      if (last && (last.payment_status === "FAILED" || last.payment_status === "USER_DROPPED" || last.payment_status === "CANCELLED")) {
        return { status: "FAILED", paymentId: String(last.cf_payment_id ?? ""), amountMinor: toMinor(last.payment_amount as number) };
      }
      return { status: "PENDING", paymentId: null, amountMinor: null };
    },

    /** Refund id is OUR id (GCR<id>) and never changes, so a repeated call cannot refund twice. */
    async createRefund(r: { orderId: string; refundId: string; amountMinor: number; note?: string }): Promise<RefundResult> {
      const data = await pg("POST", `/orders/${encodeURIComponent(r.orderId)}/refunds`, {
        refund_amount: toRupees(r.amountMinor),
        refund_id: r.refundId,
        refund_note: r.note ?? "GCODE refund",
        refund_speed: "STANDARD",
      });
      return refundFrom(data, r.refundId);
    },

    async getRefund(orderId: string, refundId: string): Promise<RefundResult> {
      return refundFrom(await pg("GET", `/orders/${encodeURIComponent(orderId)}/refunds/${encodeURIComponent(refundId)}`), refundId);
    },

    /**
     * Registers the destination with Cashfree. Cashfree holds the account number / UPI id from here on; we keep only the
     * beneficiary id. The id is OURS and unique per save, so a repeated call cannot create a second beneficiary.
     */
    async createBeneficiary(b: BeneficiaryInput): Promise<{ beneficiaryId: string }> {
      const instrument = b.method === "UPI" ? { vpa: b.upiId } : { bank_account_number: b.accountNo, bank_ifsc: b.ifsc };
      const phone = (b.phone ?? "").replace(/\D/g, "");
      const contact = {
        ...(b.email ? { beneficiary_email: b.email } : {}),
        ...(phone.length >= 10 ? { beneficiary_phone: phone.slice(-10), beneficiary_country_code: "+91" } : {}),
      };
      // Cashfree takes letters and spaces only, 100 at most, in the beneficiary name
      const name = b.holderName.replace(/[^A-Za-z ]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
      let data: Json;
      try {
        data = await payoutCall("POST", "/beneficiary", {
          beneficiary_id: b.beneficiaryId,
          beneficiary_name: name,
          beneficiary_instrument_details: instrument,
          ...(Object.keys(contact).length ? { beneficiary_contact_details: contact } : {}),
        });
      } catch (e) {
        // the same account and IFSC are already registered with us (an earlier save): use that beneficiary
        if (e instanceof CashfreeError && e.status === 409 && e.code === "beneficiary_already_exists" && b.method === "BANK") {
          data = await payoutCall("GET", `/beneficiary?bank_account_number=${encodeURIComponent(b.accountNo ?? "")}&bank_ifsc=${encodeURIComponent(b.ifsc ?? "")}`);
        } else {
          throw e;
        }
      }
      const status = String(data.beneficiary_status ?? "VERIFIED").toUpperCase();
      if (["INVALID", "FAILED", "CANCELLED", "DELETED"].includes(status)) {
        throw new CashfreeError("api", `Beneficiary ${status}`, 422, "beneficiary_not_verified");
      }
      return { beneficiaryId: String(data.beneficiary_id ?? b.beneficiaryId) };
    },

    /** Sends money to an expert's beneficiary. The transfer id is OUR id (GCP<id>), so a repeated call returns the same transfer. */
    async createTransfer(t: { transferId: string; amountMinor: number; beneficiaryId: string; method: "UPI" | "BANK" }): Promise<TransferResult> {
      const data = await payoutCall("POST", "/transfers", {
        transfer_id: t.transferId,
        transfer_amount: toRupees(t.amountMinor),
        transfer_currency: "INR",
        transfer_mode: t.method === "UPI" ? "upi" : "banktransfer",
        beneficiary_details: { beneficiary_id: t.beneficiaryId },
      });
      return transferFrom(data);
    },

    async getTransfer(transferId: string): Promise<TransferResult> {
      return transferFrom(await payoutCall("GET", `/transfers?transfer_id=${encodeURIComponent(transferId)}`));
    },
  };
}

function refundFrom(data: Json, fallbackId: string): RefundResult {
  const s = String(data.refund_status ?? "").toUpperCase();
  const status: RefundState = s === "SUCCESS" ? "SUCCESS" : s === "CANCELLED" ? "CANCELLED" : s === "ONHOLD" ? "ONHOLD" : "PENDING";
  return { refundId: String(data.refund_id ?? fallbackId), cfRefundId: data.cf_refund_id != null ? String(data.cf_refund_id) : null, status };
}

function transferFrom(data: Json): TransferResult {
  const s = String(data.status ?? "").toUpperCase();
  const status: TransferState = s === "SUCCESS" ? "SUCCESS" : ["FAILED", "REJECTED", "REVERSED", "MANUALLY_REJECTED"].includes(s) ? "FAILED" : "PENDING";
  const utr = typeof data.transfer_utr === "string" && data.transfer_utr ? data.transfer_utr : null;
  const error = status === "FAILED" ? String(data.status_description ?? data.status ?? "The transfer failed") : null;
  return { status, gatewayRef: data.cf_transfer_id != null ? String(data.cf_transfer_id) : null, utr, error };
}

export type Cashfree = ReturnType<typeof createCashfree>;

/**
 * Webhook signature: base64(HMAC-SHA256(timestamp + rawBody, secretKey)), sent in x-webhook-signature with the
 * timestamp in x-webhook-timestamp. Checked in constant time on the RAW body, before anything is parsed.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null, timestamp: string | null, secretKey: string): boolean {
  if (!signature || !timestamp || !secretKey) return false;
  const expected = createHmac("sha256", secretKey).update(timestamp + rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

let shared: Cashfree | null | undefined;

/** One client per server process; null when Cashfree is not configured (the stub gateway or no gateway). */
export function cashfree(): Cashfree | null {
  if (shared === undefined) {
    const cfg = cashfreeConfig();
    shared = cfg ? createCashfree(cfg) : null;
  }
  return shared;
}
