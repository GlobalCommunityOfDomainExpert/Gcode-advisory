import { fail, isResponse, json, limited, readJson, str } from "@/lib/server/guard";
import { relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { savePayoutAccount } from "@/lib/server/payments";
import { requireProfile } from "@/lib/server/profile";
import type { PayoutAccount } from "@/lib/booking/types";

/** The expert's payout account. GET shows it (masked); PUT registers it with Cashfree and saves only the beneficiary id and the masked label. */
export async function GET() {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const res = await ords<PayoutAccount>("/payouts/account", { token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}

export async function PUT(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const body = await readJson(request, 2048);
  if (isResponse(body)) return body;
  const blocked = limited([[`payout:account:${ctx.session.userId}`, 20, 10 * 60]]);
  if (blocked) return blocked;
  const input = {
    method: str(body.method) === "BANK" ? ("BANK" as const) : ("UPI" as const),
    holderName: str(body.holderName),
    upiId: str(body.upiId),
    accountNo: str(body.accountNo),
    ifsc: str(body.ifsc),
  };
  const res = await savePayoutAccount({ token: ctx.session.token, email: ctx.session.email }, input);
  if (res.ok) return json(res.data);
  // our own 502/503 messages from savePayoutAccount (partner down, payouts not set up) are written for the expert to read
  return (res.status === 502 || res.status === 503) && !/^HTTP \d+$/.test(res.message) ? fail(res.message, res.status) : relayError(res);
}
