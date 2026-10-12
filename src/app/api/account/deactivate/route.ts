import { checkOrigin, fail, isResponse, json, limited } from "@/lib/server/guard";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";

interface Reply {
  deactivated: boolean;
}

async function run(request: Request, method: "POST" | "DELETE") {
  const blockedOrigin = checkOrigin(request);
  if (blockedOrigin) return blockedOrigin;
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const blocked = limited([[`account:deactivate:${ctx.session.userId}`, 20, 10 * 60]]);
  if (blocked) return blocked;
  const res = await ords<Reply>("/profiles/account/deactivate", { method, body: method === "POST" ? {} : undefined, token: ctx.session.token });
  if (!res.ok) return fail(method === "POST" ? "Could not deactivate. Please try again." : "Could not reactivate. Please try again.", 502);
  return json({ deactivated: res.data.deactivated });
}

/** Pause the account: the profile is hidden, nobody can book it, sessions already booked stay. POST /api/account/deactivate */
export const POST = (request: Request) => run(request, "POST");

/** Resume. The profile stays hidden until the person publishes it again. DELETE /api/account/deactivate */
export const DELETE = (request: Request) => run(request, "DELETE");
