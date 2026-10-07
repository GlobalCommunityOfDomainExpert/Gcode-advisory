/** Browser side of the auth API. Talks only to our own /api/auth routes; the backend is never called from the browser. */

export interface AuthResult<T = Record<string, never>> {
  ok: boolean;
  status: number;
  /** Safe, user-facing text. Never a raw backend error. */
  error?: string;
  data?: T;
}

export async function postAuth<T = Record<string, never>>(path: string, body: unknown): Promise<AuthResult<T>> {
  try {
    const res = await fetch(`/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { error?: string } & T | null;
    if (!res.ok) {
      const retry = res.headers.get("Retry-After");
      const fallback =
        res.status === 429
          ? `Too many attempts. Try again in ${retry ? `${Math.ceil(Number(retry) / 60)} min` : "a few minutes"}.`
          : "Something went wrong. Please try again.";
      return { ok: false, status: res.status, error: json?.error ?? fallback };
    }
    return { ok: true, status: res.status, data: (json ?? undefined) as T | undefined };
  } catch {
    return { ok: false, status: 0, error: "Network problem. Check your connection and try again." };
  }
}
