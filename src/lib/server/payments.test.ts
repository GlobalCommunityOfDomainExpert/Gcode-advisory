import { describe, expect, it, vi } from "vitest";
import { CashfreeError, type Cashfree } from "./cashfree";
import { bookingOfOrder, handleWebhook, maskUpi, processPayouts, processRefunds, reconcile, runPaymentJobs, savePayoutAccount, startPayment, verifyOrder, type ServerApi } from "./payments";

vi.mock("./ords", () => ({ ords: vi.fn() }));
vi.mock("./env", () => ({ siteOrigin: () => "https://app.test", ordsBaseUrl: () => "http://ords" }));

/** A backend call that answers by path and records what it was sent. */
function api(answers: Record<string, unknown> = {}) {
  const calls: { path: string; body?: unknown }[] = [];
  const fn = (async (path: string, body?: unknown) => {
    calls.push({ path, body });
    const a = answers[path];
    return a === undefined ? { ok: true, data: { result: "OK" } } : typeof a === "function" ? (a as () => unknown)() : { ok: true, data: a };
  }) as unknown as ServerApi;
  return { fn, calls };
}

const cfStub = (over: Partial<Record<keyof Cashfree, unknown>> = {}) => ({ env: "sandbox", hasPayouts: true, ...over }) as unknown as Cashfree;

describe("bookingOfOrder", () => {
  it("reads the booking from our order id and nothing else", () => {
    expect(bookingOfOrder("GCB42N1")).toBe("42");
    expect(bookingOfOrder("GCB42N")).toBeNull();
    expect(bookingOfOrder("order_1")).toBeNull();
    expect(bookingOfOrder("GCB42N1; drop")).toBeNull();
  });
});

describe("startPayment", () => {
  const intent = { needsOrder: true, orderId: "GCB5N1", bookingId: 5, amountMinor: 50000, expiresAt: new Date(Date.now() + 900_000).toISOString(), customer: { id: "U1", name: "A", email: "a@b.in", phone: "9876543210" } };

  it("passes an already-open order straight through (and the mode)", async () => {
    const call = vi.fn(async () => ({ ok: true, data: { orderId: "STUB_1", gateway: "STUB" } }));
    const out = await startPayment("tok", "5", cfStub(), api().fn, "https://app.test", call as never);
    expect(out).toMatchObject({ ok: true, data: { orderId: "STUB_1", checkoutMode: "sandbox" } });
  });

  it("creates the order at Cashfree and keeps it in the database", async () => {
    const call = vi.fn(async () => ({ ok: true, data: intent }));
    const createOrder = vi.fn(async (o: unknown) => (void o, { orderId: "GCB5N1", paymentSessionId: "session_1" }));
    const { fn, calls } = api({ "/payments/orders": { orderId: "GCB5N1", status: "CREATED", paymentSessionId: "session_1" } });
    const out = await startPayment("tok", "5", cfStub({ createOrder }), fn, "https://app.test", call as never);
    expect(out).toMatchObject({ ok: true, data: { paymentSessionId: "session_1", checkoutMode: "sandbox" } });
    const sent = createOrder.mock.calls[0][0] as { returnUrl: string; notifyUrl?: string; amountMinor: number };
    expect(sent.returnUrl).toBe("https://app.test/book/return?order_id={order_id}");
    expect(sent.notifyUrl).toBe("https://app.test/api/webhooks/cashfree");
    expect(sent.amountMinor).toBe(50000);
    expect(calls[0]).toEqual({ path: "/payments/orders", body: { bookingId: "5", orderId: "GCB5N1", sessionId: "session_1" } });
  });

  it("sends no webhook address from plain http (local development)", async () => {
    const call = vi.fn(async () => ({ ok: true, data: intent }));
    const createOrder = vi.fn(async (o: unknown) => (void o, { orderId: "GCB5N1", paymentSessionId: "s" }));
    await startPayment("tok", "5", cfStub({ createOrder }), api({ "/payments/orders": { orderId: "x" } }).fn, "http://localhost:3000", call as never);
    expect((createOrder.mock.calls[0][0] as { notifyUrl?: string }).notifyUrl).toBeUndefined();
  });

  it("takes the existing order when Cashfree says it already has it", async () => {
    const call = vi.fn(async () => ({ ok: true, data: intent }));
    const createOrder = vi.fn(async () => {
      throw new CashfreeError("api", "exists", 409, "order_already_exists");
    });
    const getOrderSession = vi.fn(async () => ({ orderId: "GCB5N1", paymentSessionId: "old_session" }));
    const { fn, calls } = api({ "/payments/orders": { orderId: "GCB5N1" } });
    const out = await startPayment("tok", "5", cfStub({ createOrder, getOrderSession }), fn, "https://app.test", call as never);
    expect(out.ok).toBe(true);
    expect((calls[0].body as { sessionId: string }).sessionId).toBe("old_session");
  });

  it("answers 502 (not the gateway's words) when Cashfree fails, and 409 with no gateway configured", async () => {
    const call = vi.fn(async () => ({ ok: true, data: intent }));
    const createOrder = vi.fn(async () => {
      throw new CashfreeError("network", "secret detail");
    });
    const bad = await startPayment("tok", "5", cfStub({ createOrder }), api().fn, "https://app.test", call as never);
    expect(bad).toEqual({ ok: false, status: 502, message: "We couldn’t start the payment. Please try again." });
    const none = await startPayment("tok", "5", null, api().fn, "https://app.test", call as never);
    expect(none).toMatchObject({ ok: false, status: 409 });
  });

  it("returns the database's refusal as is", async () => {
    const call = vi.fn(async () => ({ ok: false, status: 409, message: "This booking is not waiting for payment" }));
    expect(await startPayment("tok", "5", cfStub(), api().fn, "https://app.test", call as never)).toMatchObject({ ok: false, status: 409 });
  });
});

describe("verifyOrder", () => {
  it("reports a PAID order as SUCCESS with the payment and amount, signed by us", async () => {
    const orderOutcome = vi.fn(async () => ({ status: "PAID", paymentId: "77", amountMinor: 50000 }));
    const { fn, calls } = api();
    expect(await verifyOrder("GCB5N1", cfStub({ orderOutcome }), fn)).toBe("PAID");
    expect(calls[0].path).toBe("/payments/events");
    expect(calls[0].body).toMatchObject({ gateway: "CASHFREE", orderId: "GCB5N1", sigOk: "Y", status: "SUCCESS", paymentId: "77", amountMinor: 50000, eventId: "RECON|GCB5N1|PAID|77" });
  });
  it("reports FAILED, and says nothing about PENDING or EXPIRED", async () => {
    const failed = vi.fn(async () => ({ status: "FAILED", paymentId: "8", amountMinor: 50000 }));
    const a = api();
    expect(await verifyOrder("GCB5N1", cfStub({ orderOutcome: failed }), a.fn)).toBe("FAILED");
    expect(a.calls[0].body).toMatchObject({ status: "FAILED" });
    for (const status of ["PENDING", "EXPIRED"]) {
      const b = api();
      expect(await verifyOrder("GCB5N1", cfStub({ orderOutcome: vi.fn(async () => ({ status, paymentId: null, amountMinor: null })) }), b.fn)).toBe(status);
      expect(b.calls).toHaveLength(0);
    }
  });
  it("is ERROR for a foreign order id, a gateway failure, or a database that did not take it", async () => {
    expect(await verifyOrder("order_1", cfStub(), api().fn)).toBe("ERROR");
    expect(await verifyOrder("GCB5N1", cfStub({ orderOutcome: vi.fn(async () => { throw new CashfreeError("network", "x"); }) }), api().fn)).toBe("ERROR");
    const orderOutcome = vi.fn(async () => ({ status: "PAID", paymentId: "1", amountMinor: 1 }));
    expect(await verifyOrder("GCB5N1", cfStub({ orderOutcome }), api({ "/payments/events": () => ({ ok: true, data: { result: "ERROR" } }) }).fn)).toBe("ERROR");
  });
});

describe("reconcile", () => {
  it("checks every pending order and counts the paid ones", async () => {
    const orderOutcome = vi.fn(async (id: string) => (id === "GCB1N1" ? { status: "PAID", paymentId: "1", amountMinor: 100 } : { status: "PENDING", paymentId: null, amountMinor: null }));
    const out = await reconcile(cfStub({ orderOutcome }), api({ "/payments/orders/pending": [{ orderId: "GCB1N1" }, { orderId: "GCB2N1" }] }).fn);
    expect(out).toEqual({ checked: 2, paid: 1 });
  });
  it("does nothing when the list cannot be read", async () => {
    expect(await reconcile(cfStub(), api({ "/payments/orders/pending": () => ({ ok: false, status: 503, message: "x" }) }).fn)).toEqual({ checked: 0, paid: 0 });
  });
});

describe("handleWebhook", () => {
  const pay = (type: string, status: string, extra = {}) =>
    JSON.stringify({ type, event_time: "2026-10-20T10:00:00+05:30", data: { order: { order_id: "GCB5N1" }, payment: { cf_payment_id: 321, payment_status: status, payment_amount: 500 }, ...extra } });

  it("passes a verified payment through in paise with a stable event id", async () => {
    const { fn, calls } = api();
    expect(await handleWebhook(pay("PAYMENT_SUCCESS_WEBHOOK", "SUCCESS"), true, fn)).toBe(200);
    expect(calls[0].body).toMatchObject({ orderId: "GCB5N1", sigOk: "Y", status: "SUCCESS", paymentId: "321", amountMinor: 50000, eventId: "PAYMENT_SUCCESS_WEBHOOK|321|2026-10-20T10:00:00+05:30" });
  });
  it("still logs an unverified call, marked N", async () => {
    const { fn, calls } = api();
    expect(await handleWebhook(pay("PAYMENT_SUCCESS_WEBHOOK", "SUCCESS"), false, fn)).toBe(200);
    expect((calls[0].body as { sigOk: string }).sigOk).toBe("N");
  });
  it("maps a refund event to its refund reference", async () => {
    const { fn, calls } = api();
    const body = JSON.stringify({ type: "REFUND_STATUS_WEBHOOK", event_time: "t", data: { refund: { cf_refund_id: 9, refund_id: "GCR12", order_id: "GCB5N1", refund_status: "SUCCESS" } } });
    expect(await handleWebhook(body, true, fn)).toBe(200);
    expect(calls[0].body).toMatchObject({ refundRef: "GCR12", status: "SUCCESS", orderId: "GCB5N1", paymentId: "9" });
  });
  it("ignores events we do not use, and refuses junk", async () => {
    const { fn, calls } = api();
    expect(await handleWebhook(JSON.stringify({ type: "SETTLEMENT_SUCCESS", data: { order: { order_id: "GCB5N1" } } }), true, fn)).toBe(200);
    expect(calls).toHaveLength(0);
    expect(await handleWebhook("not json", true, fn)).toBe(400);
    expect(await handleWebhook(JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "evil" } } }), true, fn)).toBe(400);
  });
  it("answers 503 when the database cannot be reached, so Cashfree sends it again", async () => {
    expect(await handleWebhook(pay("PAYMENT_SUCCESS_WEBHOOK", "SUCCESS"), true, api({ "/payments/events": () => ({ ok: false, status: 502, message: "x" }) }).fn)).toBe(503);
  });
});

describe("processRefunds", () => {
  const item = { refundId: 7, refundKey: "GCR7", orderId: "GCB5N1", amountMinor: 50000, reason: "DECLINED", mode: "create" };

  it("creates a queued refund and reports the result", async () => {
    const createRefund = vi.fn(async () => ({ refundId: "GCR7", cfRefundId: "55", status: "SUCCESS" }));
    const { fn, calls } = api({ "/payments/refunds/pending": [item] });
    expect(await processRefunds(cfStub({ createRefund }), fn)).toEqual({ queued: 1, credited: 1 });
    expect(createRefund).toHaveBeenCalledWith({ orderId: "GCB5N1", refundId: "GCR7", amountMinor: 50000, note: "DECLINED" });
    expect(calls[1]).toEqual({ path: "/payments/refunds/7/report", body: { status: "SUCCESS", gatewayRefundId: "55", error: null } });
  });
  it("checks one the gateway already has", async () => {
    const getRefund = vi.fn(async () => ({ refundId: "GCR7", cfRefundId: "55", status: "ONHOLD" }));
    const { fn, calls } = api({ "/payments/refunds/pending": [{ ...item, mode: "check" }] });
    await processRefunds(cfStub({ getRefund }), fn);
    expect(getRefund).toHaveBeenCalledWith("GCB5N1", "GCR7");
    expect((calls[1].body as { status: string }).status).toBe("PENDING");
  });
  it("reports a failed call as ERROR so the database backs off, never as a refund", async () => {
    const createRefund = vi.fn(async () => {
      throw new CashfreeError("network", "down");
    });
    const { fn, calls } = api({ "/payments/refunds/pending": [item] });
    expect(await processRefunds(cfStub({ createRefund }), fn)).toEqual({ queued: 1, credited: 0 });
    expect(calls[1].body).toMatchObject({ status: "ERROR", gatewayRefundId: null });
  });
  it("on a 400 from create, looks the refund up before giving up (we may have asked already)", async () => {
    const createRefund = vi.fn(async () => {
      throw new CashfreeError("api", "refund id exists", 400);
    });
    const getRefund = vi.fn(async () => ({ refundId: "GCR7", cfRefundId: "55", status: "SUCCESS" }));
    const { fn, calls } = api({ "/payments/refunds/pending": [item] });
    expect(await processRefunds(cfStub({ createRefund, getRefund }), fn)).toEqual({ queued: 1, credited: 1 });
    expect((calls[1].body as { status: string }).status).toBe("SUCCESS");
  });
  it("on a 400 where the lookup also fails, reports ERROR with the original message", async () => {
    const createRefund = vi.fn(async () => {
      throw new CashfreeError("api", "amount too high", 400);
    });
    const getRefund = vi.fn(async () => {
      throw new CashfreeError("api", "not found", 404);
    });
    const { fn, calls } = api({ "/payments/refunds/pending": [item] });
    await processRefunds(cfStub({ createRefund, getRefund }), fn);
    expect(calls[1].body).toMatchObject({ status: "ERROR", error: "amount too high" });
  });
  it("maps a cancelled refund so the database stops retrying", async () => {
    const createRefund = vi.fn(async () => ({ refundId: "GCR7", cfRefundId: null, status: "CANCELLED" }));
    const { fn, calls } = api({ "/payments/refunds/pending": [item] });
    await processRefunds(cfStub({ createRefund }), fn);
    expect((calls[1].body as { status: string }).status).toBe("CANCELLED");
  });
});

describe("processPayouts", () => {
  const item = { payoutId: 3, transferKey: "GCP3", amountMinor: 85000, mode: "create", method: "UPI", beneficiaryId: "GCU1_x" };

  it("does nothing without payout credentials", async () => {
    const { fn, calls } = api();
    expect(await processPayouts(cfStub({ hasPayouts: false }), fn)).toEqual({ queued: 0, paid: 0, skipped: true });
    expect(calls).toHaveLength(0);
  });
  it("sends a queued payout and reports the bank reference", async () => {
    const createTransfer = vi.fn(async () => ({ status: "SUCCESS", gatewayRef: "t1", utr: "UTR1", error: null }));
    const { fn, calls } = api({ "/payouts/pending": [item] });
    expect(await processPayouts(cfStub({ createTransfer }), fn)).toEqual({ queued: 1, paid: 1 });
    expect(createTransfer).toHaveBeenCalledWith({ transferId: "GCP3", amountMinor: 85000, beneficiaryId: "GCU1_x", method: "UPI" });
    expect(calls[1]).toEqual({ path: "/payouts/3/report", body: { status: "SUCCESS", gatewayRef: "t1", utr: "UTR1", error: null } });
  });
  it("checks one that is already on its way", async () => {
    const getTransfer = vi.fn(async () => ({ status: "PENDING", gatewayRef: "t1", utr: null, error: null }));
    const { fn } = api({ "/payouts/pending": [{ payoutId: 3, transferKey: "GCP3", amountMinor: 85000, mode: "check" }] });
    await processPayouts(cfStub({ getTransfer }), fn);
    expect(getTransfer).toHaveBeenCalledWith("GCP3");
  });
  it("reports a gateway failure as ERROR (retry), a rejected transfer as FAILED", async () => {
    const down = vi.fn(async () => {
      throw new CashfreeError("network", "down");
    });
    const a = api({ "/payouts/pending": [item] });
    await processPayouts(cfStub({ createTransfer: down }), a.fn);
    expect(a.calls[1].body).toMatchObject({ status: "ERROR" });
    const rejected = vi.fn(async () => ({ status: "FAILED", gatewayRef: null, utr: null, error: "invalid vpa" }));
    const b = api({ "/payouts/pending": [item] });
    await processPayouts(cfStub({ createTransfer: rejected }), b.fn);
    expect(b.calls[1].body).toMatchObject({ status: "FAILED", error: "invalid vpa" });
  });
});

describe("savePayoutAccount", () => {
  const who = { token: "tok", email: "a@b.in" };
  const key = "k".repeat(20);
  const upi = { method: "UPI" as const, holderName: "Asha Rao", upiId: "Asha@OkBank" };
  const okCall = () => vi.fn(async () => ({ ok: true as const, data: { hasAccount: true } }));

  it("masks a UPI id", () => {
    expect(maskUpi("asha@okbank")).toBe("as***@okbank");
  });
  it("registers with Cashfree, then tells the database only the id and a mask", async () => {
    const createBeneficiary = vi.fn(async () => ({ beneficiaryId: "x" }));
    const call = okCall();
    const out = await savePayoutAccount(who, upi, cfStub({ createBeneficiary }), call as never, key);
    expect(out.ok).toBe(true);
    expect(createBeneficiary).toHaveBeenCalledWith(expect.objectContaining({ method: "UPI", upiId: "asha@okbank", email: "a@b.in" }));
    const [path, opts] = call.mock.calls[0] as unknown as [string, { method: string; body: Record<string, unknown>; token: string; headers: Record<string, string> }];
    expect(path).toBe("/payouts/account");
    expect(opts).toMatchObject({ method: "PUT", token: "tok", headers: { "X-Server-Key": key } });
    expect(opts.body).toMatchObject({ method: "UPI", beneficiaryId: expect.stringMatching(/^GCU[0-9a-f]{20}$/), upiMasked: "as***@okbank" });
    expect(JSON.stringify(opts.body)).not.toContain("asha@okbank");
  });
  it("sends a bank account's last 4 digits and IFSC only", async () => {
    const call = okCall();
    await savePayoutAccount(who, { method: "BANK", holderName: "Asha Rao", accountNo: "1234 5678 9012", ifsc: "hdfc0001234" }, cfStub({ createBeneficiary: vi.fn(async () => ({})) }), call as never, key);
    const body = (call.mock.calls[0] as unknown as [string, { body: Record<string, unknown> }])[1].body;
    expect(body).toMatchObject({ method: "BANK", accountLast4: "9012", ifsc: "HDFC0001234" });
    expect(JSON.stringify(body)).not.toContain("123456789012");
  });
  it("refuses bad input before calling anyone", async () => {
    const createBeneficiary = vi.fn();
    const call = okCall();
    const cf = cfStub({ createBeneficiary });
    expect(await savePayoutAccount(who, { ...upi, upiId: "nope" }, cf, call as never, key)).toMatchObject({ ok: false, status: 400 });
    expect(await savePayoutAccount(who, { method: "BANK", holderName: "A B", accountNo: "123", ifsc: "HDFC0001234" }, cf, call as never, key)).toMatchObject({ ok: false, status: 400 });
    expect(await savePayoutAccount(who, { method: "BANK", holderName: "A B", accountNo: "123456789012", ifsc: "X" }, cf, call as never, key)).toMatchObject({ ok: false, status: 400 });
    expect(createBeneficiary).not.toHaveBeenCalled();
    expect(call).not.toHaveBeenCalled();
  });
  it("saves nothing when Cashfree refuses or is down, or payouts are not configured", async () => {
    const call = okCall();
    const refused = cfStub({ createBeneficiary: vi.fn(async () => { throw new CashfreeError("api", "bad", 422); }) });
    expect(await savePayoutAccount(who, upi, refused, call as never, key)).toMatchObject({ ok: false, status: 400 });
    const blocked = cfStub({ createBeneficiary: vi.fn(async () => { throw new CashfreeError("api", "IP not whitelisted", 403); }) });
    expect(await savePayoutAccount(who, upi, blocked, call as never, key)).toMatchObject({ ok: false, status: 502 });
    const down = cfStub({ createBeneficiary: vi.fn(async () => { throw new CashfreeError("network", "down"); }) });
    expect(await savePayoutAccount(who, upi, down, call as never, key)).toMatchObject({ ok: false, status: 502 });
    expect(await savePayoutAccount(who, upi, cfStub({ hasPayouts: false }), call as never, key)).toMatchObject({ ok: false, status: 503 });
    expect(await savePayoutAccount(who, upi, null, call as never, key)).toMatchObject({ ok: false, status: 503 });
    expect(call).not.toHaveBeenCalled();
  });
});

describe("runPaymentJobs", () => {
  it("does nothing when Cashfree is not configured", async () => {
    expect(await runPaymentJobs(null, api().fn)).toEqual({ configured: false });
  });
  it("runs reconcile, refunds and payouts", async () => {
    const out = await runPaymentJobs(cfStub(), api({ "/payments/orders/pending": [], "/payments/refunds/pending": [], "/payouts/pending": [] }).fn);
    expect(out).toEqual({ configured: true, orders: { checked: 0, paid: 0 }, refunds: { queued: 0, credited: 0 }, payouts: { queued: 0, paid: 0 } });
  });
});
