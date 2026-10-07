import { clientIp, fail, isResponse, json, limited, readJson, str } from "@/lib/server/guard";
import { ords } from "@/lib/server/ords";
import { passwordForBackend } from "@/lib/server/password";
import { reset } from "@/lib/server/rate-limit";
import { setSession } from "@/lib/server/session";
import { setTicket } from "@/lib/server/ticket";
import { isEmail, normalizeEmail } from "@/lib/auth/validators";

const BAD_CREDENTIALS = "Incorrect email or password.";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (isResponse(body)) return body;

  const email = normalizeEmail(str(body.email));
  const password = str(body.password);
  // Same answer for malformed input, unknown email and wrong password, so the form can't be used to find accounts.
  if (!isEmail(email) || !password || password.length > 128) return fail(BAD_CREDENTIALS, 401);

  const ipKey = `signin:ip:${clientIp(request)}`;
  const accountKey = `signin:acct:${email}`;
  const blocked = limited([
    [ipKey, 20, 10 * 60],
    [accountKey, 8, 10 * 60],
  ]);
  if (blocked) return blocked;

  const result = await ords<{ user_id: string | number; role_name: string; token: string }>("/auth/sign-in", {
    body: { email, password: passwordForBackend(password) },
  });
  if (!result.ok) {
    return result.status === 502 ? fail("Could not sign in right now. Please try again.", 502) : fail(BAD_CREDENTIALS, 401);
  }

  reset(accountKey);
  const { user_id, role_name, token } = result.data;

  // Signed up and verified but never picked a role: no session yet. A verified ticket sends them to "Who are you?".
  if (role_name === "NONE") {
    const uid = String(user_id ?? "");
    if (!/^\d{1,40}$/.test(uid)) return fail(BAD_CREDENTIALS, 401);
    await setTicket({ uid, email, stage: "verified" });
    return json({ ok: true, next: "role" });
  }

  if (!(await setSession(token))) return fail("Could not start your session. Please try again.", 502);
  return json({ ok: true, next: "app" });
}
