import { isResponse, json, limited, readJson } from "@/lib/server/guard";
import { relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";

/** Marks notifications as read: POST /api/notifications/read { id } for one, {} for all. Only the caller's own. */
export async function POST(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const body = await readJson(request, 512);
  if (isResponse(body)) return body;

  const id = body.id === undefined || body.id === null ? undefined : Number(body.id);
  if (id !== undefined && (!Number.isSafeInteger(id) || id < 1)) return json({ error: "Invalid request." }, 400);

  const blocked = limited([[`notifications:mark:${ctx.session.userId}`, 120, 10 * 60]]);
  if (blocked) return blocked;
  const res = await ords<{ ok: boolean }>("/notifications/read", { body: id === undefined ? {} : { id }, token: ctx.session.token });
  return res.ok ? json({ ok: true }) : relayError(res);
}
