import { clientIp, fail, isResponse, json, limited, readJson, str } from "@/lib/server/guard";
import { ords } from "@/lib/server/ords";
import { reset } from "@/lib/server/rate-limit";
import { getTicket, setTicket } from "@/lib/server/ticket";
import { normalizeOtp } from "@/lib/auth/validators";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (isResponse(body)) return body;

  // Who is verifying comes from the signed ticket, never from the request.
  const ticket = await getTicket();
  if (!ticket) return fail("Your sign-up session expired. Please start again.", 401);
  if (ticket.stage === "verified") return json({ ok: true });

  const code = normalizeOtp(str(body.code));
  if (!code) return fail("Enter the 6-character code.");

  // Few guesses per account (the code is short), plus a looser per-IP cap.
  const accountKey = `otp:acct:${ticket.email}`;
  const blocked = limited([
    [accountKey, 5, 10 * 60],
    [`otp:ip:${clientIp(request)}`, 30, 10 * 60],
  ]);
  if (blocked) return blocked;

  const result = await ords("/auth/verify-otp", {
    body: { email: ticket.email, otp_code: code, purpose: "REGISTRATION" },
  });

  if (!result.ok) {
    if (/expire/i.test(result.message)) return fail("That code has expired. Start sign-up again to get a new one.", 400);
    if (result.status === 502) return fail("Could not verify the code. Please try again.", 502);
    return fail("That code is not correct.", 400);
  }

  reset(accountKey);
  await setTicket({ ...ticket, stage: "verified" });
  return json({ ok: true });
}
