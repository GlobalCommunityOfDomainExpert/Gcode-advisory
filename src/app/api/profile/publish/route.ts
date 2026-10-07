import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { loadProfile, requireProfile, view } from "@/lib/server/profile";
import { ords } from "@/lib/server/ords";

/** Go live. Refused below 100%: the gate is checked here from the stored profile, not from anything the browser sent. */
export async function POST(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const body = await readJson(request);
  if (isResponse(body)) return body;
  const blocked = limited([[`profile:publish:${ctx.session.userId}`, 30, 10 * 60]]);
  if (blocked) return blocked;

  const current = await loadProfile(ctx);
  if (!current) return fail("Could not load your profile.", 502);
  if (current.completion.pct < 100) {
    const left = current.completion.per.filter((p) => p.filled < p.total).length;
    return fail(`Finish ${left} more section${left === 1 ? "" : "s"} before you publish.`, 409);
  }

  const res = await ords("/profiles/me/publish", { method: "POST", body: {}, token: ctx.session.token });
  if (!res.ok) return fail("Could not publish. Please try again.", 502);
  const after = await loadProfile(ctx);
  return after ? json(view(after)) : fail("Published, but could not reload your profile.", 502);
}

/** Take the profile down. Always allowed. */
export async function DELETE(request: Request) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const body = await readJson(request);
  if (isResponse(body)) return body;

  const res = await ords("/profiles/me/publish", { method: "DELETE", token: ctx.session.token });
  if (!res.ok) return fail("Could not unpublish. Please try again.", 502);
  const after = await loadProfile(ctx);
  return after ? json(view(after)) : fail("Unpublished, but could not reload your profile.", 502);
}
