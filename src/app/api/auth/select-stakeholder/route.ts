import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { ords } from "@/lib/server/ords";
import { setSession } from "@/lib/server/session";
import { clearTicket, getTicket } from "@/lib/server/ticket";
import { isSignUpRole } from "@/lib/auth/validators";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (isResponse(body)) return body;

  // Only someone who passed the email-code step (or proved their password at sign-in) holds a verified ticket.
  // User id and email come from it; a client-supplied id is never read.
  const ticket = await getTicket();
  if (!ticket || ticket.stage !== "verified") return fail("Verify your email first.", 401);

  if (!isSignUpRole(body.role)) return fail("Choose who you are.");

  const blocked = limited([[`role:uid:${ticket.uid}`, 10, 10 * 60]]);
  if (blocked) return blocked;

  const result = await ords<{ token?: string }>("/auth/select-stakeholder", {
    body: { user_id: ticket.uid, email: ticket.email, role_name: body.role },
    numericFields: ["user_id"],
  });
  if (!result.ok || !result.data.token) return fail("Could not complete setup. Please try again.", 502);

  if (!(await setSession(result.data.token))) return fail("Could not start your session. Please sign in.", 502);
  await clearTicket();
  return json({ ok: true });
}
