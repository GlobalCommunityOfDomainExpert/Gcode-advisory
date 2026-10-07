/** Server-only configuration. Missing values fail closed: no default backend URL, no default signing secret. */

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const isProd = process.env.NODE_ENV === "production";

/** ORDS base, e.g. https://host/ords/wksp_gcode2/v1 (no trailing slash). Never exposed to the browser. */
export function ordsBaseUrl(): string {
  return required("ORDS_BASE_URL").replace(/\/+$/, "");
}

/** Signs the onboarding ticket cookie. At least 32 characters. */
export function authSecret(): string {
  const secret = required("AUTH_SECRET");
  if (secret.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
  return secret;
}

/** Public origin of this app. Used for the Origin check and for links in emails (never taken from the request). */
export function siteOrigin(): string {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").origin;
}
