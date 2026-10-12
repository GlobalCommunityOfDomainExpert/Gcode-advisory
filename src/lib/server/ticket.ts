import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { authSecret, isProd } from "./env";

/**
 * The onboarding ticket: a short-lived, signed, httpOnly cookie that carries who is mid sign-up (email, and the id once known)
 * and how far they got. It replaces the userId/email the old flow passed around in the URL and request bodies, so a
 * caller can never pick someone else's id or skip the email-code step.
 *
 *   created   sign-up accepted, email not verified yet
 *   verified  code accepted (or password sign-in proved identity): may choose a role
 */
const TICKET_COOKIE = isProd ? "__Host-gcode_onboarding" : "gcode_onboarding";
const TTL_SECONDS = 30 * 60;

export interface Ticket {
  /** Only present after a password sign-in. The backend's sign-up does not return an id (see AUTH_PKG.sign_up). */
  uid?: string;
  email: string;
  stage: "created" | "verified";
}

type Payload = Ticket & { exp: number };

const sign = (data: string) => createHmac("sha256", authSecret()).update(data).digest("base64url");

export async function setTicket(ticket: Ticket): Promise<void> {
  const payload: Payload = { ...ticket, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  (await cookies()).set(TICKET_COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export async function getTicket(): Promise<Ticket | null> {
  const raw = (await cookies()).get(TICKET_COOKIE)?.value;
  if (!raw) return null;
  const [body, mac] = raw.split(".");
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    if (p.exp <= Math.floor(Date.now() / 1000)) return null;
    if (typeof p.email !== "string") return null;
    if (p.uid !== undefined && (typeof p.uid !== "string" || !/^\d{1,40}$/.test(p.uid))) return null;
    if (p.stage !== "created" && p.stage !== "verified") return null;
    return { ...(p.uid ? { uid: p.uid } : {}), email: p.email, stage: p.stage };
  } catch {
    return null;
  }
}

export async function clearTicket(): Promise<void> {
  // Same attributes as setTicket, so a Secure / `__Host-` cookie is really cleared (see clearSession).
  (await cookies()).set(TICKET_COOKIE, "", { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: 0 });
}
