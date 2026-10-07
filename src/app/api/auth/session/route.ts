import { json } from "@/lib/server/guard";
import { getSession } from "@/lib/server/session";

/** Who is signed in, for the UI. The token itself is never returned. */
export async function GET() {
  const session = await getSession();
  if (!session) return json({ authenticated: false });
  return json({
    authenticated: true,
    user: { userId: session.userId, role: session.roleName, fullName: session.fullName },
  });
}
