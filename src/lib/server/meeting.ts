import { ords } from "./ords";
import { isHttps, zoho, ZohoError, type Zoho } from "./zoho";
import type { JoinInfo } from "@/lib/booking/types";

/**
 * What the call page can do for this person right now.
 *  - link: the room. `embed` = shown inside our page (an iframe); otherwise it opens in its own tab. `keep` is a host link that exists
 *    only in the answer that created the session: the join route keeps it in the host's own browser (an httpOnly cookie), never on the server.
 *  - join: a video-service room that is made or looked up when the person presses "Join now" (the page itself creates nothing).
 *  - unavailable: not configured, busy, failed, or waiting for the host to open the room.
 */
export type CallLink =
  | { kind: "link"; url: string; external: boolean; embed?: boolean; keep?: string }
  | { kind: "join" }
  | { kind: "unavailable"; reason: "not_configured" | "busy" | "failed" | "waiting" };

/** The SDK's stateless start link: the only host link that works without a Zoho sign-in, and so the only one that can sit in an iframe. */
const isStateless = (u: string | undefined): u is string => !!u && /\/statelessStart/.test(u) && isHttps(u);

/** A kept host link is only used for the room it was made for (its `key` is the meeting key). */
function keptHostLink(saved: string | undefined, room: string): string | undefined {
  if (!isStateless(saved)) return undefined;
  try {
    return new URL(saved).searchParams.get("key") === room ? saved : undefined;
  } catch {
    return undefined;
  }
}

/** For the call page: for a video-service room it only says whether joining is possible; the room is made when "Join now" is pressed. */
export function previewCall(info: JoinInfo, client: Zoho | null = zoho()): CallLink | null {
  if (info.provider !== "ZOHO") return null;
  return client && process.env.MEETING_SERVER_KEY ? { kind: "join" } : { kind: "unavailable", reason: "not_configured" };
}

/**
 * Turns "the room is open for this person" (the database's answer) into a link they can follow.
 *  - LOCAL provider: the database already made the room; its link is our own stand-in page.
 *  - ZOHO provider, SDK sessions (the default): only the EXPERT makes the room, because only the answer that creates an SDK session carries
 *    the host link that works without a sign-in. The booker who arrives first is told the expert has not opened the room yet.
 *  - ZOHO provider, ordinary sessions (ZOHO_SDK=off): the first person in creates the session; then each person gets their own link,
 *    fetched fresh and never stored: the expert the host link, the booker the join link, both opening in their own tab.
 * Either way the first report to the database wins, and the room is reported with the server key.
 */
export async function resolveCall(token: string, info: JoinInfo, client: Zoho | null = zoho(), savedHostLink?: string): Promise<CallLink> {
  if (info.state !== "OPEN") return { kind: "unavailable", reason: "failed" };
  if (info.provider === "LOCAL") return info.url ? { kind: "link", url: info.url, external: false } : { kind: "unavailable", reason: "failed" };

  const serverKey = process.env.MEETING_SERVER_KEY;
  if (!client || !serverKey) return { kind: "unavailable", reason: "not_configured" };
  const sdk = client.sdk === true;

  try {
    let room = info.room;
    let keep: string | undefined;
    if (!room) {
      if (sdk && info.role !== "expert") return { kind: "unavailable", reason: "waiting" };
      const made = await client.createSession({ startAt: new Date(info.startAt), endAt: new Date(info.endAt) });
      const reported = await ords<{ ok: boolean }>(`/bookings/${info.bookingId}/room`, {
        body: { provider: "ZOHO", room: made.meetingKey, url: (isHttps(made.joinLink) ? made.joinLink : "").slice(0, 400) || "https://zoho.invalid/" },
        headers: { "X-Server-Key": serverKey },
        token,
      });
      if (!reported.ok) {
        await client.deleteSession(made.meetingKey);
        return { kind: "unavailable", reason: "failed" };
      }
      // Two people can arrive at the same moment: the database keeps the first room, so read it back and drop ours if we lost.
      const again = await ords<JoinInfo>(`/bookings/call/${info.slug}`, { token });
      room = again.ok ? again.data.room : undefined;
      if (!room) {
        await client.deleteSession(made.meetingKey);
        return { kind: "unavailable", reason: "failed" };
      }
      if (room !== made.meetingKey) await client.deleteSession(made.meetingKey);
      else if (sdk && isStateless(made.startLink)) keep = made.startLink;
    }

    const links = await client.getLinks(room);
    let url: string | undefined;
    if (info.role === "expert") url = (sdk ? (keep ?? keptHostLink(savedHostLink, room)) : undefined) ?? links.startLink;
    else url = links.joinLink;
    if (!isHttps(url)) return { kind: "unavailable", reason: "failed" };
    // inside our page: the SDK's stateless host link, and (SDK sessions) the booker's join link; everything else opens in its own tab
    const embed = isStateless(url) || (sdk && info.role !== "expert");
    return { kind: "link", url, external: !embed, embed, ...(keep ? { keep } : {}) };
  } catch (e) {
    if (e instanceof ZohoError && e.kind === "throttled") return { kind: "unavailable", reason: "busy" };
    return { kind: "unavailable", reason: "failed" };
  }
}
