import { createHmac } from "node:crypto";
import type { ZohoParticipant } from "./zoho";

/**
 * VideoSDK, the video service behind the call page's Prebuilt room (same setup as GCODE Events). Server only: the API secret never
 * leaves this file. The requests follow VideoSDK's public REST docs; the participant-report shape is read defensively because it has
 * not been checked against a live account.
 */

const BASE = "https://api.videosdk.live/v2";

export interface VideoSdk {
  createRoom(): Promise<string>;
  /** A short-lived token for ONE person in ONE room. participantId is "<bookingId>-<role>", so a forwarded token has no use elsewhere. */
  tokenFor(roomId: string, role: "expert" | "requester", participantId: string, ttlSeconds: number): string;
  endRoom(roomId: string): Promise<void>;
  getParticipants(roomId: string): Promise<ZohoParticipant[]>;
}

const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

export function videoSdkConfig(env: Record<string, string | undefined> = process.env): { key: string; secret: string } | null {
  const key = env.VIDEOSDK_API_KEY?.trim();
  const secret = (env.VIDEOSDK_API_SECRET ?? env.VIDEOSDK_SECRET)?.trim();
  return key && secret ? { key, secret } : null;
}

export function createVideoSdk(cfg: { key: string; secret: string }, fetchImpl: typeof fetch = fetch, now: () => number = Date.now): VideoSdk {
  const sign = (claims: Record<string, unknown>) => {
    const head = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = b64u(JSON.stringify(claims));
    return `${head}.${body}.${b64u(createHmac("sha256", cfg.secret).update(`${head}.${body}`).digest())}`;
  };
  const apiToken = () => {
    const iat = Math.floor(now() / 1000);
    return sign({ apikey: cfg.key, permissions: ["allow_join", "allow_mod"], version: 2, iat, exp: iat + 600 });
  };
  async function rest<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
    const res = await fetchImpl(`${BASE}${path}`, {
      method,
      headers: { Authorization: apiToken(), "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`VideoSDK ${path} failed (${res.status})`);
    return (text ? JSON.parse(text) : {}) as T;
  }

  return {
    async createRoom() {
      const r = await rest<{ roomId?: string }>("/rooms", {});
      if (!r.roomId) throw new Error("VideoSDK returned no room");
      return r.roomId;
    },
    tokenFor(roomId, role, participantId, ttlSeconds) {
      const iat = Math.floor(now() / 1000);
      return sign({
        apikey: cfg.key,
        // allow_mod alone cannot join, so the expert (host) needs both
        permissions: role === "expert" ? ["allow_join", "allow_mod"] : ["allow_join"],
        version: 2,
        roomId,
        participantId,
        iat,
        exp: iat + ttlSeconds,
      });
    },
    async endRoom(roomId) {
      await rest("/sessions/end", { roomId });
    },
    async getParticipants(roomId) {
      if (!/^[A-Za-z0-9_-]{1,100}$/.test(roomId)) throw new Error("Bad room id");
      const sessions = await rest<{ data?: { id?: string }[] }>(`/sessions/?roomId=${encodeURIComponent(roomId)}&page=1&perPage=50`, undefined, "GET");
      const rows: ZohoParticipant[] = [];
      for (const s of sessions.data ?? []) {
        if (!s.id) continue;
        const list = await rest<{ data?: { participantId?: string; timelog?: { start?: string; end?: string }[] }[] }>(
          `/sessions/participants/list?sessionId=${encodeURIComponent(s.id)}&page=1&perPage=50`,
          undefined,
          "GET",
        );
        for (const p of list.data ?? []) {
          // participantId is "<bookingId>-<role>": the role comes from our own id, not from anything the browser claims
          const role = /-expert$/.test(p.participantId ?? "") ? "host" : "participant";
          for (const t of p.timelog ?? []) {
            const joinTime = Date.parse(t.start ?? "");
            const leaveTime = t.end ? Date.parse(t.end) : joinTime;
            if (!Number.isFinite(joinTime)) continue;
            rows.push({ role, joinTime, leaveTime, duration: Math.max(0, leaveTime - joinTime) });
          }
        }
      }
      return rows;
    },
  };
}

export function videoSdk(): VideoSdk | null {
  const cfg = videoSdkConfig();
  return cfg ? createVideoSdk(cfg) : null;
}

/** The Prebuilt page. The trailing slash matters: without it the host answers 302 and drops the query string (error 4001). */
export const PREBUILT_URL = "https://embed.videosdk.live/rtc-js-prebuilt/0.3.43/";
