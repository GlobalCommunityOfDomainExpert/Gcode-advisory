/**
 * Fixed-window attempt limiter, held in memory. Good for one server process; behind several instances (or
 * serverless) each keeps its own count, so move this to a shared store (Redis, or an ORDS table) before relying on
 * it at scale. Pair a per-IP key with a per-account key: one attacker can't grind one account from many places for
 * free, and can't lock a victim out of everything from one place.
 */
interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
const MAX_KEYS = 10_000;

export interface LimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function hit(key: string, limit: number, windowSeconds: number): LimitResult {
  const now = Date.now();
  if (windows.size > MAX_KEYS) {
    for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
    if (windows.size > MAX_KEYS) windows.clear();
  }
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  current.count += 1;
  return current.count > limit
    ? { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) }
    : { allowed: true, retryAfterSeconds: 0 };
}

/** Clears a key after a success so honest users who fumbled once aren't penalised. */
export function reset(key: string): void {
  windows.delete(key);
}
