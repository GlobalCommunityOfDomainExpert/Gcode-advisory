import { clientIp, fail, isResponse, json, limited, readJson, str } from "@/lib/server/guard";
import { ords } from "@/lib/server/ords";
import { passwordForBackend } from "@/lib/server/password";
import { authSecret } from "@/lib/server/env";
import { setTicket } from "@/lib/server/ticket";
import { isPasswordValid } from "@/lib/auth/password-rules";
import { isEmail, normalizeEmail, normalizeFullName, normalizePhone } from "@/lib/auth/validators";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (isResponse(body)) return body;

  const email = normalizeEmail(str(body.email));
  const fullName = normalizeFullName(str(body.fullName));
  const phone = normalizePhone(str(body.phone));
  const password = str(body.password);

  if (!fullName) return fail("Enter your full name.");
  if (!isEmail(email)) return fail("Enter a valid email address.");
  if (!phone) return fail("Enter a 10-digit mobile number.");
  if (!isPasswordValid(password) || password.toLowerCase() === email) return fail("Password does not meet the requirements.");

  // Fail before touching the backend if the server isn't configured: otherwise the account is created, saving the
  // signed cookie then throws, and the person is left with an account they can't finish signing up for.
  try {
    authSecret();
  } catch {
    return fail("Sign-up isn’t available right now.", 503);
  }

  const blocked = limited([
    [`signup:ip:${clientIp(request)}`, 10, 60 * 60],
    [`signup:email:${email}`, 5, 60 * 60],
  ]);
  if (blocked) return blocked;

  const result = await ords<{ user_id: string | number }>("/auth/sign-up", {
    body: { email, full_name: fullName, phone, password: passwordForBackend(password) },
  });

  if (!result.ok) {
    // Naming the clash tells a visitor the email is registered. The sign-up form needs it to be usable, so it is
    // allowed here, and the sign-up limit above caps how fast it can be used to probe addresses.
    if (/already|exist|registered|duplicate|unique/i.test(result.message)) {
      return fail("An account with this email already exists. Try signing in instead.", 409);
    }
    return fail("Could not create your account. Please try again.", result.status === 502 ? 502 : 400);
  }

  const uid = String(result.data.user_id ?? "");
  if (!/^\d{1,40}$/.test(uid)) return fail("Could not create your account. Please try again.", 502);

  await setTicket({ uid, email, stage: "created" });
  return json({ ok: true });
}
