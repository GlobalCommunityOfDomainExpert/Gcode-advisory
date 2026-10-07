/** Input rules for the auth forms. Used in the browser for hints and on the server as the real check. */

export const OTP_LENGTH = 6;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** 10-digit Indian mobile number, with or without +91. Returns `+91XXXXXXXXXX`, or null if invalid. */
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/[\s-]/g, "").replace(/^\+?91(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

/** Collapses whitespace and strips control characters. Null when empty or out of range. */
export function normalizeFullName(value: string): string | null {
  // eslint-disable-next-line no-control-regex
  const name = value.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  return name.length >= 2 && name.length <= 100 ? name : null;
}

export function normalizeOtp(value: string): string | null {
  const code = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return code.length === OTP_LENGTH ? code : null;
}

/** Stakeholder roles open at launch (Startup and Institution arrive in Sprint 12). Values are `GCODE_ROLES.ROLE_NAME`. */
export const SIGN_UP_ROLES = ["EXPERT", "FRESHER"] as const;
export type SignUpRole = (typeof SIGN_UP_ROLES)[number];

export function isSignUpRole(value: unknown): value is SignUpRole {
  return typeof value === "string" && (SIGN_UP_ROLES as readonly string[]).includes(value);
}

/** Reset tokens are opaque; only check the shape so junk never reaches the backend. */
export function isResetToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9._~-]{16,512}$/.test(value);
}

/** "a***h@example.com": enough to recognise, not enough to harvest. */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (local.length <= 2) return `${local[0] ?? ""}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}
