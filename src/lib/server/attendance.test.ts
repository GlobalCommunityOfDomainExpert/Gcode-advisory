import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Zoho } from "./zoho";

const ords = vi.fn();
vi.mock("./ords", () => ({ ords: (...a: unknown[]) => ords(...a) }));
vi.mock("./zoho", async (orig) => ({ ...(await orig<typeof import("./zoho")>()), zoho: () => null }));

import { pendingAttendance, syncAttendance } from "./attendance";

const client = (rows: unknown[]) => ({ getParticipants: vi.fn(async () => rows) }) as unknown as Zoho;

beforeEach(() => {
  ords.mockReset();
  process.env.MEETING_SERVER_KEY = "key-1";
});
afterEach(() => {
  delete process.env.MEETING_SERVER_KEY;
});

describe("syncAttendance", () => {
  it("reports both roles with the server key", async () => {
    ords.mockResolvedValue({ ok: true, data: { ok: true } });
    const rows = [{ role: "presenter", joinTime: 1000, leaveTime: 301000, duration: 300000 }];
    expect(await syncAttendance(7, "mk-1", "tok", client(rows))).toBe(true);
    const [path, opts] = ords.mock.calls[0];
    expect(path).toBe("/bookings/7/attendance");
    expect(opts.headers).toEqual({ "X-Server-Key": "key-1" });
    expect(opts.body.expert.seconds).toBe(300);
    expect(opts.body.requester).toEqual({ seconds: 0, firstAt: null, lastAt: null });
  });

  it("does nothing without a client or a key, and survives a vendor failure", async () => {
    expect(await syncAttendance(7, "mk-1", "tok", null)).toBe(false);
    delete process.env.MEETING_SERVER_KEY;
    expect(await syncAttendance(7, "mk-1", "tok", client([]))).toBe(false);
    process.env.MEETING_SERVER_KEY = "key-1";
    const broken = { getParticipants: vi.fn(async () => { throw new Error("down"); }) } as unknown as Zoho;
    expect(await syncAttendance(7, "mk-1", "tok", broken)).toBe(false);
    expect(ords).not.toHaveBeenCalled();
  });

  it("is false when the database refuses", async () => {
    ords.mockResolvedValue({ ok: false, status: 403, message: "Not allowed" });
    expect(await syncAttendance(7, "mk-1", "tok", client([]))).toBe(false);
  });
});

describe("pendingAttendance", () => {
  it("asks the database with the server key", async () => {
    ords.mockResolvedValue({ ok: true, data: [{ bookingId: 1, room: "a" }] });
    expect(await pendingAttendance()).toEqual([{ bookingId: 1, room: "a" }]);
    expect(ords.mock.calls[0][1].headers).toEqual({ "X-Server-Key": "key-1" });
  });
  it("is null without a key or when the backend fails", async () => {
    ords.mockResolvedValue({ ok: false, status: 502, message: "x" });
    expect(await pendingAttendance()).toBeNull();
    delete process.env.MEETING_SERVER_KEY;
    expect(await pendingAttendance()).toBeNull();
  });
});
