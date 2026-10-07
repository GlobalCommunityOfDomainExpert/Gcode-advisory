import { clientIp, fail, isResponse, json, limited, readJson, str } from "@/lib/server/guard";
import { ords } from "@/lib/server/ords";
import { passwordForBackend } from "@/lib/server/password";
import { isPasswordValid } from "@/lib/auth/password-rules";
import { isResetToken } from "@/lib/auth/validators";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (isResponse(body)) return body;

  const token = body.token;
  const password = str(body.password);
  if (!isResetToken(token)) return fail("This reset link is invalid or has expired.", 400);
  if (!isPasswordValid(password)) return fail("Password does not meet the requirements.");

  const blocked = limited([
    [`reset:ip:${clientIp(request)}`, 10, 60 * 60],
    [`reset:token:${token.slice(0, 32)}`, 5, 60 * 60],
  ]);
  if (blocked) return blocked;

  const result = await ords("/auth/reset-password", {
    body: { token, new_password: passwordForBackend(password) },
  });
  if (!result.ok) {
    return result.status === 502
      ? fail("Could not reset your password right now. Please try again.", 502)
      : fail("This reset link is invalid or has expired.", 400);
  }
  return json({ ok: true });
}
