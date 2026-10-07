import { createHash } from "node:crypto";

/**
 * Wire format the backend (AUTH_PKG) stores today: lowercase hex SHA-256 of the password. Kept so existing
 * Events accounts keep working. It runs here, on the server, so the browser only ever sends the password to our own
 * origin over TLS (the old flow hashed in the browser, which made the hash itself the password).
 *
 * BACKEND DEBT: unsalted SHA-256 is fast to brute-force if the table leaks. AUTH_PKG should store a slow salted hash
 * (argon2id or bcrypt) and re-hash on the next successful sign-in. This module is the only place to change here.
 */
export function passwordForBackend(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}
