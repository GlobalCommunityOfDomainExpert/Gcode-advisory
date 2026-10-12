import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import { REPORT_TYPES, type ProblemReport } from "@/lib/booking/types";

/**
 * Report a problem with a session: POST /api/booking/42/report { type, note? }.
 * Either person may report, once. When it is allowed (after the 10 minute no-show grace, or after the session) is the backend's call.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id } = await params;
  if (!isNumericId(id)) return fail("We couldn’t find that booking.", 404);

  const body = await readJson(request, 4 * 1024);
  if (isResponse(body)) return body;
  const blocked = limited([[`booking:report:${ctx.session.userId}`, 20, 10 * 60]]);
  if (blocked) return blocked;

  const type = typeof body.type === "string" ? body.type.trim() : "";
  if (!REPORT_TYPES.some((t) => t.value === type)) return fail("Choose what went wrong.");
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length > 1000) return fail("The note is too long (1000 characters at most).");
  if (type === "OTHER" && note.length < 5) return fail("Please say what happened (at least 5 characters).");

  const res = await ords<ProblemReport>(`/bookings/${id}/report`, { method: "POST", body: { type, note }, token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
