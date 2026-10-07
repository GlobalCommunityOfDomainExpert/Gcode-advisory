import { clientIp, fail, isResponse, json, limited, readJson, str } from "@/lib/server/guard";
import { siteOrigin } from "@/lib/server/env";
import { ords } from "@/lib/server/ords";
import { isEmail, normalizeEmail } from "@/lib/auth/validators";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (isResponse(body)) return body;

  const email = normalizeEmail(str(body.email));
  if (!isEmail(email)) return fail("Enter a valid email address.");

  const blocked = limited([
    [`forgot:ip:${clientIp(request)}`, 10, 60 * 60],
    [`forgot:email:${email}`, 3, 60 * 60],
  ]);
  if (blocked) return blocked;

  // The link in the email is built from our configured origin, never from a client value or the Host header,
  // so an attacker can't make a victim's reset email point at a look-alike site.
  await ords("/auth/forgot-password", { body: { email, origin: siteOrigin() } });

  // Same answer whether or not the address has an account, and whether or not the send worked.
  return json({ ok: true });
}
