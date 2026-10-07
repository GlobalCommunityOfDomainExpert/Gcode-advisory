import { isResponse, json, readJson } from "@/lib/server/guard";
import { clearSession } from "@/lib/server/session";
import { clearTicket } from "@/lib/server/ticket";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (isResponse(body)) return body;
  await clearSession();
  await clearTicket();
  return json({ ok: true });
}
