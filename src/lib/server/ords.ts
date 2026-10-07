import { ordsBaseUrl } from "./env";

export type OrdsResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

interface OrdsOptions {
  body?: unknown;
  /** Body fields that must go out as JSON numbers (ids too large for a JS number are carried as strings). */
  numericFields?: string[];
  token?: string;
}

/**
 * Fields the backend returns as huge integers (USER_ID comes from sys_guid, ~36 digits). Quoted before parsing so
 * they keep every digit instead of being rounded by JSON.parse.
 */
const BIG_ID_FIELDS = /("(?:user_id|sub)"\s*:\s*)(\d{15,})/g;

/**
 * Calls ORDS from the server. ORDS answers 200 with `{ "error": ... }` for some failures, so both are checked.
 * `message` is for matching and logs; routes decide what the user is allowed to read.
 */
export async function ords<T>(path: string, { body, numericFields = [], token }: OrdsOptions = {}): Promise<OrdsResult<T>> {
  let payload = body === undefined ? undefined : JSON.stringify(body);
  for (const field of numericFields) {
    payload = payload?.replace(new RegExp(`("${field}"\\s*:\\s*)"(\\d{1,40})"`), "$1$2");
  }

  let res: Response;
  try {
    res = await fetch(`${ordsBaseUrl()}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Accept: "application/json",
        ...(payload ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: payload,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, status: 502, message: "backend unreachable" };
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = JSON.parse(text.replace(BIG_ID_FIELDS, '$1"$2"'));
  } catch {
    /* not JSON */
  }

  const err = data && typeof data === "object" ? (data as { error?: string; message?: string; cause?: string }) : null;
  if (!res.ok || (err && "error" in err)) {
    const ora = err?.cause?.match(/ORA-\d+:\s*([^\n]+)/)?.[1];
    const message = (err?.error ?? ora ?? err?.message ?? `HTTP ${res.status}`).replace(/^ORA-\d+:\s*/, "");
    return { ok: false, status: res.status, message };
  }
  return { ok: true, data: data as T };
}
