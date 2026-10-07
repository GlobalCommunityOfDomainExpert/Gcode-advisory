import { checkOrigin, fail, isResponse, json, limited } from "@/lib/server/guard";
import { enforcePublishGate, loadProfile, requireProfile, view } from "@/lib/server/profile";
import { ords } from "@/lib/server/ords";
import { fileKindsFor } from "@/lib/profile/sections";
import type { FileKind } from "@/lib/profile/types";

const MB = 1024 * 1024;
const LIMITS: Record<FileKind, { max: number; types: ("png" | "jpeg" | "pdf")[]; label: string }> = {
  photo: { max: 5 * MB, types: ["png", "jpeg"], label: "a JPG or PNG up to 5 MB" },
  banner: { max: 5 * MB, types: ["png", "jpeg"], label: "a JPG or PNG up to 5 MB" },
  logo: { max: 5 * MB, types: ["png", "jpeg"], label: "a JPG or PNG up to 5 MB" },
  deck: { max: 10 * MB, types: ["pdf"], label: "a PDF up to 10 MB" },
};
const MIME = { png: "image/png", jpeg: "image/jpeg", pdf: "application/pdf" } as const;

/** What the bytes are, from their first few bytes. The browser's filename and content type are never trusted. */
function sniff(b: Uint8Array): "png" | "jpeg" | "pdf" | null {
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length > 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return "pdf";
  return null;
}

/** "My CV (final).PDF" -> "My-CV-final.pdf": a short, safe display name. */
function safeName(name: string, ext: string): string {
  const base = name.replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 60);
  return `${base || "file"}.${ext}`;
}

/**
 * Uploads one file for the profile. SVG is refused on purpose (it can carry script). Dev note: the file is handed to
 * the backend as base64 JSON; in production this should write straight to object storage (OCI) and store only the URL.
 */
export async function POST(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const ctx = await requireProfile();
  if (isResponse(ctx)) return ctx;
  const blockedOrigin = checkOrigin(request);
  if (blockedOrigin) return blockedOrigin;

  const { kind } = await params;
  if (!fileKindsFor(ctx.role).includes(kind as FileKind)) return fail("That upload isn’t part of your profile.", 404);
  const rule = LIMITS[kind as FileKind];

  const length = Number(request.headers.get("content-length") ?? 0);
  if (!length || length > rule.max + 64 * 1024) return fail(`Choose ${rule.label}.`, 413);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) return fail("Unsupported request.", 415);

  const blocked = limited([[`profile:upload:${ctx.session.userId}`, 20, 10 * 60]]);
  if (blocked) return blocked;

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fail("Could not read the upload.");
  }
  if (!(file instanceof File) || file.size === 0 || file.size > rule.max) return fail(`Choose ${rule.label}.`, 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type || !rule.types.includes(type)) return fail(`Choose ${rule.label}.`, 415);

  const name = safeName(file.name, type === "jpeg" ? "jpg" : type);
  const saved = await ords(`/profiles/me/files/${kind}`, {
    method: "PUT",
    body: { name, contentType: MIME[type], data: Buffer.from(bytes).toString("base64") },
    token: ctx.session.token,
  });
  if (!saved.ok) return fail("Could not upload the file. Please try again.", 502);

  const loaded = await loadProfile(ctx);
  return loaded ? json(view(await enforcePublishGate(ctx, loaded))) : fail("Uploaded, but could not reload your profile.", 502);
}
