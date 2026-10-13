import { cookies } from "next/headers";
import { checkOrigin, fail, isResponse, json, limited } from "@/lib/server/guard";
import { relayError } from "@/lib/server/booking";
import { isProd } from "@/lib/server/env";
import { resolveCall } from "@/lib/server/meeting";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { JoinInfo } from "@/lib/booking/types";

const SLUG = /^[a-z0-9-]{8,20}$/;

/**
 * "Join now": POST /api/call/<slug>/join. The database decides who may enter and when; this makes (expert) or looks up the video room and
 * answers with the link to show. The host link that only the session-creating answer carries is kept in the host's own browser
 * (httpOnly cookie, this booking only, until the room closes) so a reload can get back in; it is never stored on our side.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const blockedOrigin = checkOrigin(request);
  if (blockedOrigin) return blockedOrigin;
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const slug = (await params).slug.toLowerCase();
  if (!SLUG.test(slug)) return fail("We couldn’t find that session.", 404);
  const blocked = limited([[`call:join:${ctx.session.userId}`, 30, 10 * 60]]);
  if (blocked) return blocked;

  const res = await ords<JoinInfo>(`/bookings/call/${slug}`, { token: ctx.session.token });
  if (!res.ok) return relayError(res);
  const info = res.data;

  const jar = await cookies();
  const name = `${isProd ? "__Host-" : ""}gcode_host_${info.bookingId}`;
  const link = await resolveCall(ctx.session.token, info, undefined, jar.get(name)?.value);

  if (link.kind === "link" && link.keep) {
    const secondsLeft = Math.max(60, Math.floor((new Date(info.closesAt).getTime() - Date.now()) / 1000));
    jar.set(name, link.keep, { httpOnly: true, secure: isProd, sameSite: "strict", path: "/", maxAge: Math.min(secondsLeft, 6 * 3600) });
  }
  // the kept host link goes back to the browser inside `url` anyway; the extra field is not sent on
  if (link.kind === "link") return json({ kind: "link", url: link.url, external: link.external, embed: !!link.embed });
  return json(link);
}
