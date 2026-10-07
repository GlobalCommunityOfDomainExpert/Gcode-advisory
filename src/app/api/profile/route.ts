import { fail, isResponse, json } from "@/lib/server/guard";
import { loadProfile, requireProfile, view } from "@/lib/server/profile";

/** The signed-in user's profile and its completion. */
export async function GET() {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const loaded = await loadProfile(ctx);
  return loaded ? json(view(loaded)) : fail("Could not load your profile.", 502);
}
