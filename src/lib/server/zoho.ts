/**
 * Zoho Meeting client, server only. The client secret and refresh token come from the environment and never leave the
 * server. Design and the reasons behind each rule are in docs/zoho-meeting-integration.md.
 *
 *  - Access tokens last an hour and Zoho throttles token requests hard (several in a minute locks the account out for a
 *    long while), so one token is cached for 50 minutes, concurrent callers share one request, and after a refusal we
 *    stop asking for 10 minutes instead of making it worse.
 *  - Sessions carry a generic topic and no participant emails: no personal data goes to Zoho.
 */

export type ZohoErrorKind = "not_configured" | "throttled" | "auth" | "api";

export class ZohoError extends Error {
  constructor(
    public kind: ZohoErrorKind,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ZohoError";
  }
}

export interface ZohoConfig {
  accountsBase: string;
  apiBase: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  orgId: string;
  presenterId: string;
  source: string;
  /** Make sessions through the SDK API (needs the ZohoMeeting.sdk.CREATE scope and a registered domain): their start link works without a Zoho sign-in. */
  sdk?: boolean;
}

const DOMAINS: Record<string, [string, string]> = {
  com: ["https://accounts.zoho.com", "https://meeting.zoho.com"],
  in: ["https://accounts.zoho.in", "https://meeting.zoho.in"],
  eu: ["https://accounts.zoho.eu", "https://meeting.zoho.eu"],
  au: ["https://accounts.zoho.com.au", "https://meeting.zoho.com.au"],
  jp: ["https://accounts.zoho.jp", "https://meeting.zoho.jp"],
  sa: ["https://accounts.zoho.sa", "https://meeting.zoho.sa"],
  ca: ["https://accounts.zohocloud.ca", "https://meeting.zohocloud.ca"],
};

/** null when Zoho is not fully configured (the call page then says video is not available). */
export function zohoConfig(env: Record<string, string | undefined> = process.env): ZohoConfig | null {
  const domains = DOMAINS[(env.ZOHO_DC ?? "").toLowerCase()];
  const { ZOHO_CLIENT_ID: clientId, ZOHO_CLIENT_SECRET: clientSecret, ZOHO_REFRESH_TOKEN: refreshToken, ZOHO_ORG_ID: orgId, ZOHO_PRESENTER_ID: presenterId } = env;
  if (!domains || !clientId || !clientSecret || !refreshToken || !orgId || !presenterId) return null;
  if (!/^\d{1,20}$/.test(orgId) || !/^\d{1,20}$/.test(presenterId)) return null;
  return { accountsBase: domains[0], apiBase: domains[1], clientId, clientSecret, refreshToken, orgId, presenterId, source: env.ZOHO_SOURCE_NAME || "GCODE", sdk: (env.ZOHO_SDK ?? "").trim().toLowerCase() !== "off" };
}

/** One row of Zoho's participant report. Times are epoch milliseconds; duration is milliseconds in the call. */
export interface ZohoParticipant {
  role: string;
  joinTime: number;
  leaveTime: number;
  duration: number;
}

export interface Attendance {
  expert: { seconds: number; firstAt: string | null; lastAt: string | null };
  requester: { seconds: number; firstAt: string | null; lastAt: string | null };
}

/**
 * Zoho's report has no GCODE user ids. Our sessions use the GCODE presenter account as host, and the expert starts the
 * meeting with the host link, so the presenter row is the expert and every other row is the booker (rejoins add up).
 * The meeting is password protected and the join link is only given to the two people.
 */
export function summarizeParticipants(rows: ZohoParticipant[]): Attendance {
  const empty = () => ({ seconds: 0, first: Infinity, last: 0 });
  const acc = { expert: empty(), requester: empty() };
  for (const r of rows) {
    if (!Number.isFinite(r.duration) || !Number.isFinite(r.joinTime)) continue;
    const side = /^(presenter|host|co-?host)$/i.test(r.role) ? acc.expert : acc.requester;
    side.seconds += Math.max(0, Math.round(r.duration / 1000));
    side.first = Math.min(side.first, r.joinTime);
    side.last = Math.max(side.last, Number.isFinite(r.leaveTime) ? r.leaveTime : r.joinTime);
  }
  const out = (s: ReturnType<typeof empty>) => ({
    seconds: Math.min(s.seconds, 86400),
    firstAt: s.first === Infinity ? null : new Date(s.first).toISOString(),
    lastAt: s.last === 0 ? null : new Date(s.last).toISOString(),
  });
  return { expert: out(acc.expert), requester: out(acc.requester) };
}

export interface ZohoLinks {
  meetingKey: string;
  joinLink?: string;
  startLink?: string;
}

const TOKEN_MS = 50 * 60_000;
const BACKOFF_MS = 10 * 60_000;
const GRACE_MIN = 0;  // the session is as long as it was booked: Zoho's own end-of-session notice then matches the booked end
const MIN_MIN = 15;

/** First value stored under `key` anywhere in the answer (Zoho nests it differently per call). */
function deepFind(obj: unknown, key: string): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  const direct = o[key];
  if ((typeof direct === "string" && direct) || typeof direct === "number") return String(direct);
  for (const v of Object.values(o)) {
    const found = deepFind(v, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

const isHttps = (u: string | undefined): u is string => {
  try {
    return !!u && new URL(u).protocol === "https:";
  } catch {
    return false;
  }
};

/** "Oct 12, 2026 09:30 AM" in IST, the format the create call wants. */
export function zohoStartTime(at: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("month")} ${get("day")}, ${get("year")} ${get("hour")}:${get("minute")} ${get("dayPeriod").toUpperCase()}`;
}

export function createZoho(cfg: ZohoConfig, fetchImpl: typeof fetch = fetch, now: () => number = Date.now) {
  let cached: { token: string; until: number } | null = null;
  let inflight: Promise<string> | null = null;
  let blockedUntil = 0;

  async function mint(): Promise<string> {
    if (now() < blockedUntil) throw new ZohoError("throttled", "Zoho is limiting token requests; waiting before asking again");
    let res: Response;
    try {
      res = await fetchImpl(`${cfg.accountsBase}/oauth/v2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "refresh_token", client_id: cfg.clientId, client_secret: cfg.clientSecret, refresh_token: cfg.refreshToken }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new ZohoError("api", "Zoho is unreachable");
    }
    const json = (await res.json().catch(() => null)) as { access_token?: string; error_description?: string; error?: string } | null;
    if (json?.access_token) {
      cached = { token: json.access_token, until: now() + TOKEN_MS };
      return json.access_token;
    }
    // "too many requests continuously": back off hard. Anything else (revoked token, wrong client) is a configuration problem.
    if (/too many requests/i.test(json?.error_description ?? "")) {
      blockedUntil = now() + BACKOFF_MS;
      throw new ZohoError("throttled", "Zoho is limiting token requests", res.status);
    }
    throw new ZohoError("auth", `Zoho refused the token request (${json?.error ?? res.status})`, res.status);
  }

  function token(): Promise<string> {
    if (cached && now() < cached.until) return Promise.resolve(cached.token);
    inflight ??= mint().finally(() => {
      inflight = null;
    });
    return inflight;
  }

  async function call(method: "GET" | "POST" | "DELETE", path: string, body?: unknown, retried = false): Promise<unknown> {
    const t = await token();
    let res: Response;
    try {
      res = await fetchImpl(`${cfg.apiBase}${path}`, {
        method,
        headers: { Authorization: `Zoho-oauthtoken ${t}`, "X-ZSOURCE": cfg.source, "Content-Type": "application/json;charset=UTF-8" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new ZohoError("api", "Zoho is unreachable");
    }
    if (res.status === 401 && !retried) {
      cached = null; // the token was revoked or expired early: one fresh try
      return call(method, path, body, true);
    }
    if (!res.ok && res.status !== 404) throw new ZohoError("api", `Zoho answered ${res.status}`, res.status);
    return res.status === 204 ? null : res.json().catch(() => null);
  }

  return {
    /** True when sessions are made through the SDK API. */
    sdk: !!cfg.sdk,

    /** Creates the session for one booking. Times are real instants; a start already in the past is moved to "now". */
    async createSession(input: { startAt: Date; endAt: Date }): Promise<ZohoLinks> {
      const start = new Date(Math.max(input.startAt.getTime(), now() + 60_000));
      const minutes = Math.max(MIN_MIN, Math.ceil((input.endAt.getTime() - start.getTime()) / 60_000)) + GRACE_MIN;
      const path = cfg.sdk ? `/meeting/api/v2/${cfg.orgId}/sdk/session` : `/api/v2/${cfg.orgId}/sessions.json`;
      const answer = await call("POST", path, {
        session: { topic: "GCODE session", agenda: "GCODE advisory session", presenter: Number(cfg.presenterId), startTime: zohoStartTime(start), duration: minutes * 60_000, timezone: "Asia/Calcutta" },
      });
      const meetingKey = deepFind(answer, "meetingKey");
      if (!meetingKey) throw new ZohoError("api", "Zoho created a session but gave no meeting key");
      return { meetingKey, joinLink: deepFind(answer, "joinLink"), startLink: deepFind(answer, "startLink") };
    },

    /** The two links of an existing session. Never stored by us: fetched when someone is allowed in. */
    async getLinks(meetingKey: string): Promise<ZohoLinks> {
      if (!/^[A-Za-z0-9_-]{1,100}$/.test(meetingKey)) throw new ZohoError("api", "Bad meeting key");
      const answer = await call("GET", `/api/v2/${cfg.orgId}/sessions/${encodeURIComponent(meetingKey)}.json`);
      return { meetingKey, joinLink: deepFind(answer, "joinLink"), startLink: deepFind(answer, "startLink") };
    },

    /** Who was in the call and for how long. Pages through the report. */
    async getParticipants(meetingKey: string): Promise<ZohoParticipant[]> {
      if (!/^[A-Za-z0-9_-]{1,100}$/.test(meetingKey)) throw new ZohoError("api", "Bad meeting key");
      const rows: ZohoParticipant[] = [];
      for (let index = 1; index <= 1000; index += 100) {
        const answer = (await call("GET", `/api/v2/${cfg.orgId}/participant/${encodeURIComponent(meetingKey)}.json?index=${index}&count=100`)) as {
          participants?: ZohoParticipant[];
          participantsCount?: number;
        } | null;
        const page = answer?.participants ?? [];
        rows.push(...page.map((p) => ({ role: String(p.role ?? ""), joinTime: Number(p.joinTime), leaveTime: Number(p.leaveTime), duration: Number(p.duration) })));
        if (page.length < 100) break;
      }
      return rows;
    },

    async deleteSession(meetingKey: string): Promise<void> {
      if (!/^[A-Za-z0-9_-]{1,100}$/.test(meetingKey)) return;
      await call("DELETE", `/api/v2/${cfg.orgId}/sessions/${encodeURIComponent(meetingKey)}.json`).catch(() => null);
    },
  };
}

export type Zoho = ReturnType<typeof createZoho>;

/** One client per server process, so the token cache and the back-off are shared by every request. */
let shared: { cfg: ZohoConfig; client: Zoho } | null = null;
export function zoho(): Zoho | null {
  const cfg = zohoConfig();
  if (!cfg) return null;
  if (!shared || JSON.stringify(shared.cfg) !== JSON.stringify(cfg)) shared = { cfg, client: createZoho(cfg) };
  return shared.client;
}

export { isHttps };
