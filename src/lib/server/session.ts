import { cookies } from "next/headers";
import { isProd } from "./env";

/** `__Host-` pins the cookie to this exact host: Secure, path "/", no Domain. Plain-http local dev can't set it. */
const SESSION_COOKIE = isProd ? "__Host-gcode_session" : "gcode_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export interface Session {
  token: string;
  userId: string;
  roleName: string;
  fullName: string;
  email?: string;
}

type Claims = Omit<Session, "token"> & { exp?: number };

/**
 * Reads the JWT's claims for display and routing only. The signature is verified by the backend on every call
 * (AUTH_PKG.get_verified_user_id); the browser never holds the token, so a claim can't be forged client-side.
 */
function decode(token: string): Claims | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    if (payload.sub === undefined || payload.sub === null) return null;
    return {
      userId: String(payload.sub),
      roleName: typeof payload.role === "string" ? payload.role : "NONE",
      fullName: typeof payload.full_name === "string" ? payload.full_name : "",
      email: typeof payload.email === "string" ? payload.email : undefined,
      exp: typeof payload.exp === "number" ? payload.exp : undefined,
    };
  } catch {
    return null;
  }
}

const now = () => Math.floor(Date.now() / 1000);

export async function setSession(token: string): Promise<boolean> {
  const claims = decode(token);
  if (!claims || (claims.exp !== undefined && claims.exp <= now())) return false;
  const maxAge = Math.min(MAX_AGE, claims.exp !== undefined ? claims.exp - now() : MAX_AGE);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return true;
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claims = decode(token);
  if (!claims || (claims.exp !== undefined && claims.exp <= now())) return null;
  return { token, userId: claims.userId, roleName: claims.roleName, fullName: claims.fullName, email: claims.email };
}

export async function clearSession(): Promise<void> {
  // Expire with the same attributes the cookie was set with. A bare delete() omits `Secure`, and browsers ignore
  // that for a Secure (and `__Host-`) cookie, so sign-out would silently do nothing.
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: isProd, sameSite: "lax", path: "/", maxAge: 0 });
}
