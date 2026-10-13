import { ords } from "./ords";
import { isHttps, zoho, ZohoError, type Zoho } from "./zoho";
import type { JoinInfo } from "@/lib/booking/types";

/** What the call page can do for this person right now. */
/** embed: the link is the video vendor's room and is shown inside our own call page (an iframe), not opened in another tab. */
export type CallLink = { kind: "link"; url: string; external: boolean; embed?: boolean } | { kind: "unavailable"; reason: "not_configured" | "busy" | "failed" };

/**
 * Turns "the room is open for this person" (the database's answer) into a link they can follow.
 *  - LOCAL provider: the database already made the room; its link is our own stand-in page.
 *  - ZOHO provider: the first person in creates the Zoho session and reports it back to the database (which keeps only the
 *    first report); then each person gets their own link, fetched fresh and never stored: the expert the host link,
 *    the booker the join link. An SDK stateless start link is shown inside our page (embed); any other link opens in its own tab.
 */
export async function resolveCall(token: string, info: JoinInfo, client: Zoho | null = zoho()): Promise<CallLink> {
  if (info.state !== "OPEN") return { kind: "unavailable", reason: "failed" };
  if (info.provider === "LOCAL") return info.url ? { kind: "link", url: info.url, external: false } : { kind: "unavailable", reason: "failed" };

  const serverKey = process.env.MEETING_SERVER_KEY;
  if (!client || !serverKey) return { kind: "unavailable", reason: "not_configured" };

  try {
    let room = info.room;
    if (!room) {
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
    }

    const links = await client.getLinks(room);
    const url = info.role === "expert" ? links.startLink : links.joinLink;
    // Only the SDK's stateless start link can live inside an iframe (the ordinary start link bounces through Zoho's sign-in page, which
    // refuses to be framed). Every other link keeps opening in its own tab.
    const embed = /\/statelessStart/.test(url ?? "");
    return isHttps(url) ? { kind: "link", url, external: !embed, embed } : { kind: "unavailable", reason: "failed" };
  } catch (e) {
    if (e instanceof ZohoError && e.kind === "throttled") return { kind: "unavailable", reason: "busy" };
    return { kind: "unavailable", reason: "failed" };
  }
}
