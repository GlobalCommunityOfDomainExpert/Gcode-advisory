import { isResponse, json, limited } from "@/lib/server/guard";
import { relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { Earnings } from "@/lib/booking/types";

/** What the expert has earned, what is on its way, and the payout history. GET /api/payout/earnings */
export async function GET() {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const blocked = limited([[`payout:earnings:${ctx.session.userId}`, 60, 10 * 60]]);
  if (blocked) return blocked;
  const res = await ords<Earnings>("/payouts/earnings", { token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
