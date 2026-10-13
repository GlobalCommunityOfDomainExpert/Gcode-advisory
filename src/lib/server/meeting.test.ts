import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { JoinInfo } from "@/lib/booking/types";
import type { Zoho } from "./zoho";
import { ZohoError } from "./zoho";

const ords = vi.fn();
vi.mock("./ords", () => ({ ords: (...a: unknown[]) => ords(...a) }));
vi.mock("./zoho", async (orig) => ({ ...(await orig<typeof import("./zoho")>()), zoho: () => null }));

import { resolveCall } from "./meeting";

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
    expect(out).toEqual({ kind: "link", url: "https://meet.test/j?pwd=1", external: false, embed: true });
    expect(z.createSession).toHaveBeenCalledTimes(1);
    const [path, opts] = ords.mock.calls[0];
    expect(path).toBe("/bookings/7/room");
    expect(opts.headers).toEqual({ "X-Server-Key": "key-1" });
    expect(opts.body).toMatchObject({ provider: "ZOHO", room: "mk-new" });
    expect(z.deleteSession).not.toHaveBeenCalled();
  });

  it("the expert gets the host link, never the join link", async () => {
    const z = fakeClient();
    const out = await resolveCall("tok", { ...base, role: "expert", needsRoom: false, room: "mk-9" }, z);
    expect(out).toEqual({ kind: "link", url: "https://meet.test/s?sig=1", external: false, embed: true });
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
