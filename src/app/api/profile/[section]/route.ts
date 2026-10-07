import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { enforcePublishGate, loadProfile, requireProfile, view } from "@/lib/server/profile";
import { ords } from "@/lib/server/ords";
import { sectionsFor } from "@/lib/profile/config";
import { parseSection } from "@/lib/profile/sections";
import type { SectionId } from "@/lib/profile/types";

/** Saves one tab. The body is validated against that tab's rules; nothing the browser says about completion is trusted. */
export async function PUT(request: Request, { params }: { params: Promise<{ section: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;

  const body = await readJson(request, 64 * 1024);
  if (isResponse(body)) return body;

  const { section } = await params;
  if (!sectionsFor(ctx.role).includes(section as SectionId)) return fail("Unknown section.", 404);

  const parsed = parseSection(ctx.role, section as SectionId, body);
  if (!parsed.ok) return fail(parsed.error);

  const blocked = limited([[`profile:write:${ctx.session.userId}`, 120, 10 * 60]]);
  if (blocked) return blocked;

  const saved = await ords(`/profiles/me/${section}`, { method: "PUT", body: parsed.patch, token: ctx.session.token });
  if (!saved.ok) return fail("Could not save. Please try again.", 502);

  const loaded = await loadProfile(ctx);
  if (!loaded) return fail("Saved, but could not reload your profile.", 502);
  // A save that drops completion below 100% takes a live profile down.
  return json(view(await enforcePublishGate(ctx, loaded)));
}
