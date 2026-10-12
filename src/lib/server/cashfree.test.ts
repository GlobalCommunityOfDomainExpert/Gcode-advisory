import { createHmac, generateKeyPairSync, privateDecrypt } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { CashfreeError, cashfreeConfig, createCashfree, payoutSignature, toMinor, toRupees, verifyWebhookSignature } from "./cashfree";

const cfg = { env: "sandbox" as const, appId: "app-id", secretKey: "secret-key", payout: { clientId: "po-id", clientSecret: "po-secret" } };

/** A fetch that answers in order and remembers what it was asked. */
function fakeFetch(...answers: { status?: number; body: unknown }[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const a = answers.shift() ?? { body: {} };
    return new Response(JSON.stringify(a.body), { status: a.status ?? 200 });
  });
  return { fn: fn as unknown as typeof fetch, calls };
}

describe("money units", () => {
  it("converts paise and rupees without drift", () => {
    expect(toRupees(50000)).toBe(500);
    expect(toRupees(12345)).toBe(123.45);
    expect(toMinor("123.45")).toBe(12345);
    expect(toMinor(0.1 + 0.2)).toBe(30);
  });
});

describe("cashfreeConfig", () => {
  it("is null without the keys, sandbox by default, payouts optional", () => {
    expect(cashfreeConfig({})).toBeNull();
    expect(cashfreeConfig({ CASHFREE_APP_ID: "a" })).toBeNull();
    const c = cashfreeConfig({ CASHFREE_APP_ID: "a", CASHFREE_SECRET_KEY: "s" });
    expect(c).toEqual({ env: "sandbox", appId: "a", secretKey: "s", payout: undefined, apiBase: undefined });
    expect(cashfreeConfig({ CASHFREE_APP_ID: "a", CASHFREE_SECRET_KEY: "s", CASHFREE_ENV: "Production", CASHFREE_PAYOUT_CLIENT_ID: "p", CASHFREE_PAYOUT_CLIENT_SECRET: "q" })).toEqual({
      env: "production",
      appId: "a",
      secretKey: "s",
      payout: { clientId: "p", clientSecret: "q" },
      apiBase: undefined,
    });
  });

  it("only honours the local stand-in address in sandbox, outside production, and only on localhost", () => {
    const base = { CASHFREE_APP_ID: "a", CASHFREE_SECRET_KEY: "s", CASHFREE_API_BASE: "http://localhost:4010/" };
    expect(cashfreeConfig(base)?.apiBase).toBe("http://localhost:4010");
    expect(cashfreeConfig({ ...base, CASHFREE_ENV: "production" })?.apiBase).toBeUndefined();
    expect(cashfreeConfig({ ...base, NODE_ENV: "production" })?.apiBase).toBeUndefined();
    expect(cashfreeConfig({ ...base, CASHFREE_API_BASE: "https://evil.example" })?.apiBase).toBeUndefined();
    expect(cashfreeConfig({ ...base, CASHFREE_API_BASE: "http://localhost.evil.example" })?.apiBase).toBeUndefined();
  });
});

describe("verifyWebhookSignature", () => {
  const body = '{"type":"PAYMENT_SUCCESS_WEBHOOK"}';
  const ts = "1700000000000";
  const good = createHmac("sha256", "secret-key").update(ts + body).digest("base64");
  it("accepts the right signature", () => {
    expect(verifyWebhookSignature(body, good, ts, "secret-key")).toBe(true);
  });
  it("rejects a changed body, timestamp, key, a missing header, or a different length", () => {
    expect(verifyWebhookSignature(body + " ", good, ts, "secret-key")).toBe(false);
    expect(verifyWebhookSignature(body, good, "1700000000001", "secret-key")).toBe(false);
    expect(verifyWebhookSignature(body, good, ts, "other-key")).toBe(false);
    expect(verifyWebhookSignature(body, null, ts, "secret-key")).toBe(false);
    expect(verifyWebhookSignature(body, good, null, "secret-key")).toBe(false);
    expect(verifyWebhookSignature(body, "short", ts, "secret-key")).toBe(false);
  });
});

describe("createOrder", () => {
  it("sends rupees, our ids, the version header and the credentials, and returns the session", async () => {
    const { fn, calls } = fakeFetch({ body: { order_id: "GCB1N1", payment_session_id: "session_x" } });
    const cf = createCashfree(cfg, fn);
    const out = await cf.createOrder({
      orderId: "GCB1N1",
      amountMinor: 50000,
      customer: { id: "U1", name: "Asha", email: "a@b.in", phone: "9876543210" },
      returnUrl: "https://app/book/return?order_id={order_id}",
      notifyUrl: "https://app/api/webhooks/cashfree",
      expiresAt: new Date("2026-10-20T10:00:00Z"),
    });
    expect(out).toEqual({ orderId: "GCB1N1", paymentSessionId: "session_x" });
    expect(calls[0].url).toBe("https://sandbox.cashfree.com/pg/orders");
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers["x-client-id"]).toBe("app-id");
    expect(headers["x-client-secret"]).toBe("secret-key");
    expect(headers["x-api-version"]).toBe("2023-08-01");
    const sent = JSON.parse(String(calls[0].init.body));
    expect(sent.order_amount).toBe(500);
    expect(sent.order_id).toBe("GCB1N1");
    expect(sent.order_meta.return_url).toContain("{order_id}");
    expect(sent.order_expiry_time).toBe("2026-10-20T10:00:00.000Z");
  });

  it("uses the production host in production, and fails when there is no session", async () => {
    const { fn, calls } = fakeFetch({ body: { order_id: "x" } });
    const cf = createCashfree({ ...cfg, env: "production" }, fn);
    await expect(
      cf.createOrder({ orderId: "GCB1N1", amountMinor: 100, customer: { id: "U", name: "n", email: "e", phone: "9999999999" }, returnUrl: "r", expiresAt: new Date() }),
    ).rejects.toMatchObject({ kind: "api" });
    expect(calls[0].url).toBe("https://api.cashfree.com/pg/orders");
  });

  it("reports an API error with its code and status", async () => {
    const { fn } = fakeFetch({ status: 409, body: { code: "order_already_exists", message: "exists" } });
    const cf = createCashfree(cfg, fn);
    const err = await cf
      .createOrder({ orderId: "GCB1N1", amountMinor: 100, customer: { id: "U", name: "n", email: "e", phone: "9999999999" }, returnUrl: "r", expiresAt: new Date() })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(CashfreeError);
    expect(err).toMatchObject({ kind: "api", status: 409, code: "order_already_exists" });
  });

  it("reports a network failure as such", async () => {
    const cf = createCashfree(cfg, (async () => {
      throw new Error("offline");
    }) as typeof fetch);
    await expect(cf.getOrderSession("GCB1N1")).rejects.toMatchObject({ kind: "network" });
  });
});

describe("orderOutcome", () => {
  const order = (status: string) => ({ order_status: status, order_amount: 500 });
  it("is PAID when any payment succeeded, with that payment and amount in paise", async () => {
    const { fn } = fakeFetch({ body: order("ACTIVE") }, { body: [{ cf_payment_id: 11, payment_status: "FAILED", payment_amount: 500 }, { cf_payment_id: 12, payment_status: "SUCCESS", payment_amount: 500 }] });
    expect(await createCashfree(cfg, fn).orderOutcome("GCB1N1")).toEqual({ status: "PAID", paymentId: "12", amountMinor: 50000 });
  });
  it("is PAID when the order says so even if the payment list is empty", async () => {
    const { fn } = fakeFetch({ body: order("PAID") }, { body: [] });
    expect(await createCashfree(cfg, fn).orderOutcome("GCB1N1")).toMatchObject({ status: "PAID", amountMinor: 50000 });
  });
  it("is EXPIRED for an expired order, FAILED when the last attempt failed, PENDING otherwise", async () => {
    expect((await createCashfree(cfg, fakeFetch({ body: order("EXPIRED") }, { body: [] }).fn).orderOutcome("a")).status).toBe("EXPIRED");
    expect((await createCashfree(cfg, fakeFetch({ body: order("ACTIVE") }, { body: [{ cf_payment_id: 1, payment_status: "USER_DROPPED", payment_amount: 500 }] }).fn).orderOutcome("a")).status).toBe("FAILED");
    expect((await createCashfree(cfg, fakeFetch({ body: order("ACTIVE") }, { body: [] }).fn).orderOutcome("a")).status).toBe("PENDING");
    expect((await createCashfree(cfg, fakeFetch({ body: order("ACTIVE") }, { body: [{ cf_payment_id: 1, payment_status: "PENDING", payment_amount: 500 }] }).fn).orderOutcome("a")).status).toBe("PENDING");
  });
});

describe("refunds", () => {
  it("creates with our refund id in rupees and maps the status", async () => {
    const { fn, calls } = fakeFetch({ body: { refund_id: "GCR7", cf_refund_id: 99, refund_status: "PENDING" } });
    const r = await createCashfree(cfg, fn).createRefund({ orderId: "GCB1N1", refundId: "GCR7", amountMinor: 50000, note: "DECLINED" });
    expect(r).toEqual({ refundId: "GCR7", cfRefundId: "99", status: "PENDING" });
    expect(calls[0].url).toBe("https://sandbox.cashfree.com/pg/orders/GCB1N1/refunds");
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({ refund_id: "GCR7", refund_amount: 500, refund_speed: "STANDARD" });
  });
  it("maps SUCCESS, CANCELLED, ONHOLD", async () => {
    for (const [from, to] of [["SUCCESS", "SUCCESS"], ["CANCELLED", "CANCELLED"], ["ONHOLD", "ONHOLD"], ["WHATEVER", "PENDING"]]) {
      const { fn } = fakeFetch({ body: { refund_status: from } });
      expect((await createCashfree(cfg, fn).getRefund("o", "GCR1")).status).toBe(to);
    }
  });
});

describe("transfers", () => {
  it("needs payout credentials", async () => {
    const cf = createCashfree({ ...cfg, payout: undefined }, fakeFetch().fn);
    expect(cf.hasPayouts).toBe(false);
    await expect(cf.getTransfer("GCP1")).rejects.toMatchObject({ kind: "not_configured" });
  });
  it("registers a UPI beneficiary with the payout headers", async () => {
    const { fn, calls } = fakeFetch({ body: { beneficiary_id: "GCU1_x" } });
    const out = await createCashfree(cfg, fn).createBeneficiary({ beneficiaryId: "GCU1_x", method: "UPI", holderName: "Asha Rao", upiId: "asha@okbank", email: "a@b.in", phone: "+91 98765 43210" });
    expect(out).toEqual({ beneficiaryId: "GCU1_x" });
    expect(calls[0].url).toBe("https://sandbox.cashfree.com/payout/beneficiary");
    expect((calls[0].init.headers as Record<string, string>)["x-client-id"]).toBe("po-id");
    const sent = JSON.parse(String(calls[0].init.body));
    expect(sent).toMatchObject({ beneficiary_id: "GCU1_x", beneficiary_name: "Asha Rao" });
    expect(sent.beneficiary_instrument_details).toEqual({ vpa: "asha@okbank" });
    expect(sent.beneficiary_contact_details.beneficiary_phone).toBe("9876543210");
  });
  it("registers a bank beneficiary", async () => {
    const { fn, calls } = fakeFetch({ body: {} });
    await createCashfree(cfg, fn).createBeneficiary({ beneficiaryId: "GCU1_y", method: "BANK", holderName: "A", accountNo: "123456789012", ifsc: "HDFC0001234" });
    expect(JSON.parse(String(calls[0].init.body)).beneficiary_instrument_details).toEqual({ bank_account_number: "123456789012", bank_ifsc: "HDFC0001234" });
  });
  it("sends a transfer to a beneficiary and never carries account details", async () => {
    const { fn, calls } = fakeFetch({ body: { status: "RECEIVED", cf_transfer_id: "t1" } });
    const out = await createCashfree(cfg, fn).createTransfer({ transferId: "GCP5", amountMinor: 85000, beneficiaryId: "GCU1_x", method: "UPI" });
    expect(out).toEqual({ status: "PENDING", gatewayRef: "t1", utr: null, error: null });
    expect(calls[0].url).toBe("https://sandbox.cashfree.com/payout/transfers");
    const sent = JSON.parse(String(calls[0].init.body));
    expect(sent).toMatchObject({ transfer_id: "GCP5", transfer_amount: 850, transfer_mode: "upi", beneficiary_details: { beneficiary_id: "GCU1_x" } });
  });
  it("sends a bank transfer and maps results", async () => {
    const { fn, calls } = fakeFetch({ body: { status: "SUCCESS", transfer_utr: "UTR9", cf_transfer_id: "t2" } }, { body: { status: "REJECTED", status_description: "bad ifsc" } });
    const cf = createCashfree(cfg, fn);
    expect(await cf.createTransfer({ transferId: "GCP6", amountMinor: 10000, beneficiaryId: "GCU1_y", method: "BANK" })).toMatchObject({ status: "SUCCESS", utr: "UTR9" });
    expect(JSON.parse(String(calls[0].init.body)).transfer_mode).toBe("banktransfer");
    expect(await cf.getTransfer("GCP6")).toEqual({ status: "FAILED", gatewayRef: null, utr: null, error: "bad ifsc" });
  });
});

describe("payout signature (for hosts without a fixed IP)", () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pem = publicKey.export({ type: "spki", format: "pem" }).toString();

  it("is base64(RSA-OAEP of clientId.unixSeconds)", () => {
    const sig = payoutSignature("po-id", pem, 1_700_000_000_999);
    expect(privateDecrypt(privateKey, Buffer.from(sig, "base64")).toString()).toBe("po-id.1700000000");
  });
  it("is sent as x-cf-signature on payout calls only, and the PEM may come with literal \n", async () => {
    const c = cashfreeConfig({ CASHFREE_APP_ID: "a", CASHFREE_SECRET_KEY: "s", CASHFREE_PAYOUT_CLIENT_ID: "p", CASHFREE_PAYOUT_CLIENT_SECRET: "q", CASHFREE_PAYOUT_PUBLIC_KEY: pem.replace(/\n/g, "\\n") });
    expect(c?.payout?.publicKey).toBe(pem);
    const { fn, calls } = fakeFetch({ body: {} }, { body: {} });
    const cf = createCashfree(c!, fn);
    await cf.getTransfer("GCP1");
    expect((calls[0].init.headers as Record<string, string>)["x-cf-signature"]).toBeTruthy();
    await cf.getOrderSession("o").catch(() => undefined);
    expect((calls[1].init.headers as Record<string, string>)["x-cf-signature"]).toBeUndefined();
  });
  it("is absent without a public key", async () => {
    const { fn, calls } = fakeFetch({ body: {} });
    await createCashfree(cfg, fn).getTransfer("GCP1");
    expect((calls[0].init.headers as Record<string, string>)["x-cf-signature"]).toBeUndefined();
  });
});

describe("beneficiary rules from the Cashfree docs", () => {
  it("sends the holder name as letters and spaces only", async () => {
    const { fn, calls } = fakeFetch({ status: 201, body: { beneficiary_status: "VERIFIED" } });
    await createCashfree(cfg, fn).createBeneficiary({ beneficiaryId: "GCUabc", method: "UPI", holderName: "Dr. Asha O'Neil-Rao 2nd", upiId: "a@b" });
    expect(JSON.parse(String(calls[0].init.body)).beneficiary_name).toBe("Dr Asha O Neil Rao nd");
  });
  it("refuses a beneficiary Cashfree marks INVALID", async () => {
    const { fn } = fakeFetch({ status: 201, body: { beneficiary_status: "INVALID" } });
    await expect(createCashfree(cfg, fn).createBeneficiary({ beneficiaryId: "GCUabc", method: "UPI", holderName: "Asha", upiId: "a@b" })).rejects.toMatchObject({ status: 422 });
  });
  it("reuses an existing bank beneficiary when the same account is registered again", async () => {
    const { fn, calls } = fakeFetch({ status: 409, body: { code: "beneficiary_already_exists", message: "exists" } }, { body: { beneficiary_id: "OLD1", beneficiary_status: "VERIFIED" } });
    const out = await createCashfree(cfg, fn).createBeneficiary({ beneficiaryId: "GCUabc", method: "BANK", holderName: "Asha", accountNo: "123456789012", ifsc: "HDFC0001234" });
    expect(out).toEqual({ beneficiaryId: "OLD1" });
    expect(calls[1].url).toBe("https://sandbox.cashfree.com/payout/beneficiary?bank_account_number=123456789012&bank_ifsc=HDFC0001234");
  });
  it("treats a manually rejected transfer as failed", async () => {
    const { fn } = fakeFetch({ body: { status: "MANUALLY_REJECTED", status_description: "no" } });
    expect(await createCashfree(cfg, fn).getTransfer("GCP9")).toMatchObject({ status: "FAILED" });
  });
});
