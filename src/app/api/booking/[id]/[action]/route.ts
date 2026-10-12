import { fail, isResponse, json, limited, readJson } from "@/lib/server/guard";
import { isNumericId, relayError } from "@/lib/server/booking";
import { ords } from "@/lib/server/ords";
import { requireProfile } from "@/lib/server/profile";
import type { BookingView } from "@/lib/booking/types";

const ACTIONS = new Set(["accept", "decline", "cancel"]);

/**
 * The booking lifecycle: POST /api/booking/42/accept, /decline or /cancel.
 * decline and cancel take { reason, note }. Who may do what is decided by the backend; "pay" has its own route.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string; action: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const { id, action } = await params;
  if (!isNumericId(id) || !ACTIONS.has(action)) return fail("We couldn’t find that booking.", 404);

  const body = await readJson(request, 2 * 1024);
  if (isResponse(body)) return body;

  const blocked = limited([[`booking:${action}:${ctx.session.userId}`, 60, 10 * 60]]);
  if (blocked) return blocked;

  let payload: Record<string, string> = {};
  if (action !== "accept") {
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (!/^[A-Z_]{3,40}$/.test(reason)) return fail("Choose a reason.");
    if (note.length > 500) return fail("The note is too long (500 characters at most).");
    payload = { reason, note };
  }

  const res = await ords<BookingView>(`/bookings/${id}/${action}`, { method: "POST", body: payload, token: ctx.session.token });
  return res.ok ? json(res.data) : relayError(res);
}
