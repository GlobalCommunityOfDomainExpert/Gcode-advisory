import { isResponse, json, limited } from "@/lib/server/guard";
import { requireProfile } from "@/lib/server/profile";
import { ords } from "@/lib/server/ords";

/** Type-ahead for the skills field: approved skills whose name (or a word in it) starts with `q`. */
export async function GET(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;

  const q = (new URL(request.url).searchParams.get("q") ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 40);
  if (!q) return json({ skills: [] });

  const blocked = limited([[`profile:skills:${ctx.session.userId}`, 300, 10 * 60]]);
  if (blocked) return blocked;

  // The backend parameter is `term`: ORDS reserves `q` for its own JSON filter.
  const res = await ords<unknown>(`/profiles/skills?term=${encodeURIComponent(q)}`, { token: ctx.session.token });
  if (!res.ok || !Array.isArray(res.data)) return json({ skills: [] });
  return json({ skills: res.data.filter((s): s is string => typeof s === "string").slice(0, 8) });
}
