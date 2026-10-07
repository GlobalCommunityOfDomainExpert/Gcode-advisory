/**
 * Where to land after signing in. Only ever a same-app path: anything absolute, protocol-relative ("//host"),
 * backslash-tricked ("/\host"), containing control characters or pointing at /api falls back to the default.
 * The result is rebuilt from a parsed URL, never echoed from the input.
 */
export function safeRedirect(value: string | null | undefined, fallback = "/directory"): string {
  if (!value || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, "http://gcode.invalid");
    if (url.origin !== "http://gcode.invalid") return fallback;
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
