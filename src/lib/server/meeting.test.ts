import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JoinInfo } from "@/lib/booking/types";
import type { Zoho } from "./zoho";
import { ZohoError } from "./zoho";

const ords = vi.fn();
vi.mock("./ords", () => ({ ords: (...a: unknown[]) => ords(...a) }));
vi.mock("./zoho", async (orig) => ({ ...(await orig<typeof import("./zoho")>()), zoho: () => null }));

import { previewCall, resolveCall } from "./meeting";

const base: JoinInfo = {
  bookingId: 7,
  slug: "abc-defg-hij",
  role: "requester",
  state: "OPEN",
  serviceTitle: "Advice",
  otherName: "Asha",
  startAt: "2026-10-12T04:30:00Z",
  endAt: "2026-10-12T05:00:00Z",
  opensAt: "2026-10-12T04:20:00Z",
  closesAt: "2026-10-12T05:15:00Z",
  provider: "ZOHO",
  needsRoom: true,
};

function fakeClient(over: Partial<Record<keyof Zoho, unknown>> = {}) {
  const c = {
    createSession: vi.fn(async () => ({ meetingKey: "mk-new", joinLink: "https://meet.test/j", startLink: "https://meet.test/s" })),
    getLinks: vi.fn(async (k: string) => ({ meetingKey: k, joinLink: "https://meet.test/j?pwd=1", startLink: "https://meet.test/s?sig=1" })),
    deleteSession: vi.fn(async () => undefined),
    ...over,
  };
  return c as unknown as Zoho & typeof c;
}

beforeEach(() => {
  ords.mockReset();
  process.env.MEETING_SERVER_KEY = "key-1";
});
afterEach(() => {
  delete process.env.MEETING_SERVER_KEY;
});

describe("resolveCall", () => {
  it("LOCAL gives the stand-in room link", async () => {
    expect(await resolveCall("tok", { ...base, provider: "LOCAL", room: "local-7", url: "/call/7/room" }, null)).toEqual({ kind: "link", url: "/call/7/room", external: false });
  });

  it("is unavailable when the room is not open", async () => {
    expect(await resolveCall("tok", { ...base, state: "EARLY" }, fakeClient())).toMatchObject({ kind: "unavailable" });
  });

  it("is 'not configured' without a Zoho client or without the server key", async () => {
    expect(await resolveCall("tok", base, null)).toEqual({ kind: "unavailable", reason: "not_configured" });
    delete process.env.MEETING_SERVER_KEY;
    expect(await resolveCall("tok", base, fakeClient())).toEqual({ kind: "unavailable", reason: "not_configured" });
  });

  it("the first person creates the room, reports it with the server key, and gets the join link (booker)", async () => {
    const z = fakeClient();
    ords.mockResolvedValueOnce({ ok: true, data: { ok: true } }).mockResolvedValueOnce({ ok: true, data: { ...base, room: "mk-new", needsRoom: false } });
    const out = await resolveCall("tok", base, z);
    expect(out).toEqual({ kind: "link", url: "https://meet.test/j?pwd=1", external: true, embed: false });
    expect(z.createSession).toHaveBeenCalledTimes(1);
    const [path, opts] = ords.mock.calls[0];
    expect(path).toBe("/bookings/7/room");
    expect(opts.headers).toEqual({ "X-Server-Key": "key-1" });
    expect(opts.body).toMatchObject({ provider: "ZOHO", room: "mk-new" });
    expect(z.deleteSession).not.toHaveBeenCalled();
  });

  it("an SDK stateless start link is shown inside our page; every other link opens in its own tab", async () => {
    const sdk = fakeClient({ getLinks: vi.fn(async (k: string) => ({ meetingKey: k, joinLink: "https://meet.test/j?pwd=1", startLink: "https://meeting.zoho.in/meeting/statelessStart?signature=abc&key=1&frameOrigin=https://advisory.gcode.in" })) });
    const out = await resolveCall("tok", { ...base, role: "expert", needsRoom: false, room: "mk-9" }, sdk);
    expect(out).toMatchObject({ kind: "link", external: false, embed: true });
  });

  it("the expert gets the host link, never the join link", async () => {
    const z = fakeClient();
    const out = await resolveCall("tok", { ...base, role: "expert", needsRoom: false, room: "mk-9" }, z);
    expect(out).toEqual({ kind: "link", url: "https://meet.test/s?sig=1", external: true, embed: false });
    expect(z.createSession).not.toHaveBeenCalled();
    expect(z.getLinks).toHaveBeenCalledWith("mk-9");
  });

  it("an existing room is reused, nothing is created or reported", async () => {
    const z = fakeClient();
    await resolveCall("tok", { ...base, needsRoom: false, room: "mk-9" }, z);
    expect(z.createSession).not.toHaveBeenCalled();
    expect(ords).not.toHaveBeenCalled();
  });

  it("if someone else's room won the race, ours is deleted and theirs is used", async () => {
    const z = fakeClient();
    ords.mockResolvedValueOnce({ ok: true, data: { ok: true } }).mockResolvedValueOnce({ ok: true, data: { ...base, room: "mk-other", needsRoom: false } });
    const out = await resolveCall("tok", base, z);
    expect(z.deleteSession).toHaveBeenCalledWith("mk-new");
    expect(z.getLinks).toHaveBeenCalledWith("mk-other");
    expect(out).toMatchObject({ kind: "link" });
  });

  it("if the database refuses the report, the new Zoho session is deleted", async () => {
    const z = fakeClient();
    ords.mockResolvedValueOnce({ ok: false, status: 403, message: "Not allowed" });
    expect(await resolveCall("tok", base, z)).toEqual({ kind: "unavailable", reason: "failed" });
    expect(z.deleteSession).toHaveBeenCalledWith("mk-new");
  });

  it("a throttled Zoho becomes 'busy', other failures 'failed'", async () => {
    const busy = fakeClient({ createSession: vi.fn(async () => { throw new ZohoError("throttled", "x"); }) });
    expect(await resolveCall("tok", base, busy)).toEqual({ kind: "unavailable", reason: "busy" });
    const broken = fakeClient({ createSession: vi.fn(async () => { throw new ZohoError("api", "x"); }) });
    expect(await resolveCall("tok", base, broken)).toEqual({ kind: "unavailable", reason: "failed" });
  });

  it("refuses a link that is not https", async () => {
    const z = fakeClient({ getLinks: vi.fn(async (k: string) => ({ meetingKey: k, joinLink: "javascript:alert(1)", startLink: "http://insecure" })) });
    expect(await resolveCall("tok", { ...base, needsRoom: false, room: "mk-9" }, z)).toEqual({ kind: "unavailable", reason: "failed" });
    expect(await resolveCall("tok", { ...base, role: "expert", needsRoom: false, room: "mk-9" }, z)).toEqual({ kind: "unavailable", reason: "failed" });
  });
});

describe("resolveCall with SDK sessions", () => {
  const STATELESS = "https://meeting.zoho.in/meeting/statelessStart?signature=abc&key=mk-sdk&frameOrigin=https://advisory.gcode.in";
  const sdkClient = (over: Partial<Record<keyof Zoho, unknown>> = {}) => {
    const c = {
      sdk: true,
      createSession: vi.fn(async () => ({ meetingKey: "mk-sdk", joinLink: "https://meet.zoho.in/abc-def-ghi", startLink: STATELESS })),
      getLinks: vi.fn(async (k: string) => ({ meetingKey: k, joinLink: "https://meet.zoho.in/abc-def-ghi", startLink: "https://meeting.zoho.in/meeting/meeting-start?key=" + k })),
      deleteSession: vi.fn(async () => undefined),
      ...over,
    };
    return c as unknown as Zoho & typeof c;
  };

  it("the expert makes the room and gets the stateless host link, framed in our page, to keep in their own browser", async () => {
    const z = sdkClient();
    ords.mockResolvedValueOnce({ ok: true, data: { ok: true } }).mockResolvedValueOnce({ ok: true, data: { ...base, room: "mk-sdk", needsRoom: false } });
    const out = await resolveCall("tok", { ...base, role: "expert" }, z);
    expect(out).toEqual({ kind: "link", url: STATELESS, external: false, embed: true, keep: STATELESS });
    expect(z.createSession).toHaveBeenCalledTimes(1);
  });

  it("a booker who arrives before the expert is told to wait, and nothing is created", async () => {
    const z = sdkClient();
    expect(await resolveCall("tok", base, z)).toEqual({ kind: "unavailable", reason: "waiting" });
    expect(z.createSession).not.toHaveBeenCalled();
    expect(ords).not.toHaveBeenCalled();
  });

  it("once the room exists the booker gets the join link, framed in our page", async () => {
    const z = sdkClient();
    const out = await resolveCall("tok", { ...base, needsRoom: false, room: "mk-sdk" }, z);
    expect(out).toEqual({ kind: "link", url: "https://meet.zoho.in/abc-def-ghi", external: false, embed: true });
  });

  it("the expert coming back gets the kept host link, but only for the same room", async () => {
    const z = sdkClient();
    const back = { ...base, role: "expert" as const, needsRoom: false, room: "mk-sdk" };
    expect(await resolveCall("tok", back, z, STATELESS)).toMatchObject({ kind: "link", url: STATELESS, embed: true });
    const other = await resolveCall("tok", { ...back, room: "mk-other" }, z, STATELESS);
    expect(other).toMatchObject({ kind: "link", external: true, embed: false });
    expect((other as { url: string }).url).toContain("meeting-start");
    const junk = await resolveCall("tok", back, z, "http://evil.test/statelessStart?key=mk-sdk");
    expect((junk as { url: string }).url).toContain("meeting-start");
  });

  it("previewCall: a video-service room is made on 'Join now', the stand-in room is already there, no Zoho means not configured", () => {
    process.env.MEETING_SERVER_KEY = "key-1";
    expect(previewCall(base, sdkClient())).toEqual({ kind: "join" });
    expect(previewCall({ ...base, provider: "LOCAL" }, sdkClient())).toBeNull();
    expect(previewCall(base, null)).toEqual({ kind: "unavailable", reason: "not_configured" });
  });
});
