import { describe, expect, it, vi } from "vitest";
import { createZoho, summarizeParticipants, zohoConfig, zohoStartTime, ZohoError, type ZohoConfig } from "./zoho";

const cfg: ZohoConfig = {
  accountsBase: "https://accounts.test",
  apiBase: "https://meeting.test",
  clientId: "cid",
  clientSecret: "secret",
  refreshToken: "refresh",
  orgId: "111",
  presenterId: "222",
  source: "GCODE",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** A fake Zoho: counts token requests and records calls. */
function fakeZoho(over: { token?: () => Response } = {}) {
  const tokens: number[] = [];
  const calls: { method: string; url: string; body: unknown; auth: string | null }[] = [];
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/oauth/v2/token")) {
      tokens.push(1);
      return over.token ? over.token() : json({ access_token: `tok-${tokens.length}`, expires_in: 3600 });
    }
    const headers = new Headers(init?.headers);
    calls.push({ method: init?.method ?? "GET", url, body: init?.body ? JSON.parse(String(init.body)) : undefined, auth: headers.get("authorization") });
    if (url.endsWith("/sessions.json")) return json({ session: { meetingKey: "mk-1", joinLink: "https://meet.test/j/1?pwd=x", startLink: "https://meet.test/s/1?sig=y" } });
    if (url.includes("/sessions/mk-1.json") && init?.method === "GET") return json({ session: { joinLink: "https://meet.test/j/1?pwd=x", startLink: "https://meet.test/s/1?sig=y" } });
    return json({}, 200);
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, tokens, calls };
}

describe("zohoConfig", () => {
  const full = { ZOHO_DC: "in", ZOHO_CLIENT_ID: "a", ZOHO_CLIENT_SECRET: "b", ZOHO_REFRESH_TOKEN: "c", ZOHO_ORG_ID: "1", ZOHO_PRESENTER_ID: "2" };
  it("builds the India endpoints", () => {
    const c = zohoConfig(full);
    expect(c?.accountsBase).toBe("https://accounts.zoho.in");
    expect(c?.apiBase).toBe("https://meeting.zoho.in");
    expect(c?.source).toBe("GCODE");
  });
  it("is null when anything is missing, the data centre is unknown, or an id is not a number", () => {
    expect(zohoConfig({ ...full, ZOHO_REFRESH_TOKEN: "" })).toBeNull();
    expect(zohoConfig({ ...full, ZOHO_DC: "mars" })).toBeNull();
    expect(zohoConfig({ ...full, ZOHO_ORG_ID: "1/../x" })).toBeNull();
    expect(zohoConfig({})).toBeNull();
  });
});

describe("zohoStartTime", () => {
  it("formats an instant as IST in Zoho's style, hour padded", () => {
    expect(zohoStartTime(new Date("2026-10-12T04:30:00Z"))).toBe("Oct 12, 2026 10:00 AM");
    expect(zohoStartTime(new Date("2026-10-12T13:30:00Z"))).toBe("Oct 12, 2026 07:00 PM");
  });
});

describe("token handling", () => {
  it("asks for a token once and reuses it", async () => {
    const z = fakeZoho();
    const client = createZoho(cfg, z.fetchImpl);
    await client.getLinks("mk-1");
    await client.getLinks("mk-1");
    await client.getLinks("mk-1");
    expect(z.tokens.length).toBe(1);
    expect(z.calls.every((c) => c.auth === "Zoho-oauthtoken tok-1")).toBe(true);
  });

  it("shares one token request between callers that arrive together", async () => {
    const z = fakeZoho();
    const client = createZoho(cfg, z.fetchImpl);
    await Promise.all([client.getLinks("mk-1"), client.getLinks("mk-1"), client.getLinks("mk-1")]);
    expect(z.tokens.length).toBe(1);
  });

  it("gets a new token after 50 minutes", async () => {
    const z = fakeZoho();
    let t = 1_000_000;
    const client = createZoho(cfg, z.fetchImpl, () => t);
    await client.getLinks("mk-1");
    t += 49 * 60_000;
    await client.getLinks("mk-1");
    expect(z.tokens.length).toBe(1);
    t += 2 * 60_000;
    await client.getLinks("mk-1");
    expect(z.tokens.length).toBe(2);
  });

  it("after Zoho says 'too many requests' it stops asking for 10 minutes", async () => {
    const z = fakeZoho({ token: () => json({ error: "Access Denied", error_description: "You have made too many requests continuously. Please try again after some time." }, 400) });
    let t = 1_000_000;
    const client = createZoho(cfg, z.fetchImpl, () => t);
    await expect(client.getLinks("mk-1")).rejects.toMatchObject({ kind: "throttled" });
    await expect(client.getLinks("mk-1")).rejects.toMatchObject({ kind: "throttled" });
    await expect(client.getLinks("mk-1")).rejects.toMatchObject({ kind: "throttled" });
    expect(z.tokens.length).toBe(1);
    t += 11 * 60_000;
    await expect(client.getLinks("mk-1")).rejects.toBeInstanceOf(ZohoError);
    expect(z.tokens.length).toBe(2);
  });

  it("a refused refresh token is an auth problem, not a throttle", async () => {
    const z = fakeZoho({ token: () => json({ error: "invalid_code" }, 400) });
    await expect(createZoho(cfg, z.fetchImpl).getLinks("mk-1")).rejects.toMatchObject({ kind: "auth" });
  });

  it("a 401 from the API drops the token and tries once more", async () => {
    let first = true;
    const tokens: number[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/oauth/")) {
        tokens.push(1);
        return json({ access_token: `t${tokens.length}` });
      }
      if (first) {
        first = false;
        return json({}, 401);
      }
      return json({ session: { joinLink: "https://meet.test/j", startLink: "https://meet.test/s" } });
    }) as unknown as typeof fetch;
    const links = await createZoho(cfg, fetchImpl).getLinks("mk-1");
    expect(tokens.length).toBe(2);
    expect(links.joinLink).toBe("https://meet.test/j");
  });
});

describe("createSession", () => {
  it("sends a generic topic, no participants, the presenter and the IST start", async () => {
    const z = fakeZoho();
    const client = createZoho(cfg, z.fetchImpl, () => new Date("2026-10-10T00:00:00Z").getTime());
    const made = await client.createSession({ startAt: new Date("2026-10-12T04:30:00Z"), endAt: new Date("2026-10-12T05:00:00Z") });
    expect(made).toEqual({ meetingKey: "mk-1", joinLink: "https://meet.test/j/1?pwd=x", startLink: "https://meet.test/s/1?sig=y" });
    const sent = (z.calls[0].body as { session: Record<string, unknown> }).session;
    expect(sent.topic).toBe("GCODE session");
    expect(sent.presenter).toBe(222);
    expect(sent.startTime).toBe("Oct 12, 2026 10:00 AM");
    expect(sent.duration).toBe(45 * 60_000);          // 30 minutes + 15 minutes of grace
    expect(sent.timezone).toBe("Asia/Calcutta");
    expect(JSON.stringify(sent)).not.toMatch(/participants|email/i);
    expect(z.calls[0].url).toBe("https://meeting.test/api/v2/111/sessions.json");
  });

  it("moves a start that is already in the past to a minute from now and keeps the end", async () => {
    const z = fakeZoho();
    const now = new Date("2026-10-12T04:40:00Z").getTime();             // 10 minutes after the start
    const client = createZoho(cfg, z.fetchImpl, () => now);
    await client.createSession({ startAt: new Date("2026-10-12T04:30:00Z"), endAt: new Date("2026-10-12T05:00:00Z") });
    const sent = (z.calls[0].body as { session: Record<string, unknown> }).session;
    expect(sent.startTime).toBe("Oct 12, 2026 10:11 AM");
    expect(sent.duration).toBe((19 + 15) * 60_000);
  });

  it("fails when Zoho answers without a meeting key", async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => (String(input).includes("/oauth/") ? json({ access_token: "t" }) : json({ session: {} }))) as unknown as typeof fetch;
    await expect(createZoho(cfg, fetchImpl).createSession({ startAt: new Date(Date.now() + 3600_000), endAt: new Date(Date.now() + 7200_000) })).rejects.toMatchObject({ kind: "api" });
  });
});

describe("keys are checked before they reach a URL", () => {
  it("refuses odd meeting keys", async () => {
    const z = fakeZoho();
    const client = createZoho(cfg, z.fetchImpl);
    await expect(client.getLinks("../../x")).rejects.toBeInstanceOf(ZohoError);
    await client.deleteSession("a/b");
    expect(z.calls.length).toBe(0);
  });
});

describe("summarizeParticipants", () => {
  // the shape of a real report from the live test (milliseconds)
  const rows = [
    { role: "presenter", joinTime: 1791555792294, leaveTime: 1791555853019, duration: 60725 },
    { role: "participant", joinTime: 1791555830031, leaveTime: 1791555840992, duration: 10961 },
  ];
  it("presenter is the expert, everyone else the booker, in whole seconds", () => {
    const s = summarizeParticipants(rows);
    expect(s.expert.seconds).toBe(61);
    expect(s.requester.seconds).toBe(11);
    expect(s.expert.firstAt).toBe(new Date(1791555792294).toISOString());
    expect(s.requester.lastAt).toBe(new Date(1791555840992).toISOString());
  });
  it("rejoins add up and the span runs from the first join to the last leave", () => {
    const s = summarizeParticipants([
      { role: "participant", joinTime: 1000, leaveTime: 61000, duration: 60000 },
      { role: "participant", joinTime: 100000, leaveTime: 190000, duration: 90000 },
    ]);
    expect(s.requester.seconds).toBe(150);
    expect(s.requester.firstAt).toBe(new Date(1000).toISOString());
    expect(s.requester.lastAt).toBe(new Date(190000).toISOString());
  });
  it("a role that never came is reported as 0 seconds with no times", () => {
    const s = summarizeParticipants([rows[1]]);
    expect(s.expert).toEqual({ seconds: 0, firstAt: null, lastAt: null });
  });
  it("ignores rows with bad numbers and caps at a day", () => {
    const s = summarizeParticipants([{ role: "participant", joinTime: NaN, leaveTime: 0, duration: 5 }, { role: "presenter", joinTime: 1, leaveTime: 2, duration: 9e9 }]);
    expect(s.requester.seconds).toBe(0);
    expect(s.expert.seconds).toBe(86400);
  });
});

describe("getParticipants", () => {
  it("reads the report and normalises the numbers", async () => {
    const fetchImpl = (async (input: RequestInfo | URL) =>
      String(input).includes("/oauth/")
        ? json({ access_token: "t" })
        : json({ participantsCount: 1, participants: [{ role: "presenter", joinTime: "5", leaveTime: "9", duration: "4", email: "x@y" }] })) as unknown as typeof fetch;
    const rows = await createZoho(cfg, fetchImpl).getParticipants("mk-1");
    expect(rows).toEqual([{ role: "presenter", joinTime: 5, leaveTime: 9, duration: 4 }]);
  });
});
