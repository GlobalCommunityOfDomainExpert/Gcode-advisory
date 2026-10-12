import { isResponse, json, limited } from "@/lib/server/guard";
import { relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { NotificationList } from "@/lib/notifications/types";

/** The bell: the signed-in person's latest notifications and the unread count. GET /api/notifications */
export async function GET() {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const blocked = limited([[`notifications:read:${ctx.session.userId}`, 120, 10 * 60]]);
  if (blocked) return blocked;
  const res = await ords<NotificationList>("/notifications/me", { token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
