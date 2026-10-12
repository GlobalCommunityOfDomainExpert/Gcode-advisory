import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { NotificationPrefs } from "@/lib/notifications/types";

const TIME = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

/** The signed-in person's own notification settings. GET /api/notifications/prefs */
export async function GET() {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const blocked = limited([[`notifications:prefs:${ctx.session.userId}`, 120, 10 * 60]]);
  if (blocked) return blocked;
  const res = await ords<NotificationPrefs>("/notifications/prefs", { token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}

/** Changes any of the five settings; the rest keep their value. Checked here and again in the database. */
export async function PUT(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const body = await readJson(request, 1024);
  if (isResponse(body)) return body;

  const patch: Partial<NotificationPrefs> = {};
  for (const key of ["emailOn", "inAppOn", "quietOn"] as const) {
    if (key in body) {
      if (typeof body[key] !== "boolean") return fail("Settings must be on or off.");
      patch[key] = body[key];
    }
  }
  for (const key of ["quietFrom", "quietTo"] as const) {
    if (key in body) {
      const v = body[key];
      if (typeof v !== "string" || !TIME.test(v)) return fail("Choose a time for quiet hours.");
      patch[key] = v;
    }
  }

  const blocked = limited([[`notifications:prefs-write:${ctx.session.userId}`, 60, 10 * 60]]);
  if (blocked) return blocked;
  const res = await ords<NotificationPrefs>("/notifications/prefs", { method: "PUT", body: patch, token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
