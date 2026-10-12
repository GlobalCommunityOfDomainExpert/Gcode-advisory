import { cashfreeConfig, verifyWebhookSignature } from "@/lib/server/cashfree";
import { handleWebhook } from "@/lib/server/payments";

/**
 * Cashfree webhook: POST /api/webhooks/cashfree. Public on purpose (Cashfree has no session), safe because the
 * signature is checked on the raw body with our secret key before anything is believed. Answers quickly:
 * 200 once the database has the event, 401 for a bad signature (logged as ignored), 503 if the database could not be
 * reached (Cashfree delivers again).
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 64 * 1024) return new Response("Too large", { status: 413 });
  const cfg = cashfreeConfig();
  if (!cfg) return new Response("Not found", { status: 404 });
  const verified = verifyWebhookSignature(raw, request.headers.get("x-webhook-signature"), request.headers.get("x-webhook-timestamp"), cfg.secretKey);
  const status = await handleWebhook(raw, verified);
  if (status === 200 && !verified) return new Response("Unauthorized", { status: 401 });
  return new Response(status === 200 ? "ok" : "error", { status });
}
