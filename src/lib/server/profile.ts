import { NextResponse } from "next/server";
import { completion } from "@/lib/profile/config";
import { normalizeDoc } from "@/lib/profile/sections";
import { ROLE_BY_NAME, type Completion, type ProfileDoc, type ProfileRole } from "@/lib/profile/types";
import { fail } from "./guard";
import { ords } from "./ords";
import { getSession, type Session } from "./session";

export interface ProfileContext {
  session: Session;
  role: ProfileRole;
}

/** The signed-in user and their profile role. Who is asking comes from the session cookie, never from the request. */
export async function requireProfile(): Promise<ProfileContext | NextResponse> {
  const session = await getSession();
  if (!session) return fail("Please sign in.", 401);
  const role = ROLE_BY_NAME[session.roleName];
  if (!role) return fail("Finish choosing who you are first.", 403);
  return { session, role };
}

export interface ProfileView {
  profile: ProfileDoc;
  completion: Completion;
}

/** Reads the caller's profile from the backend (identified by their token) and normalises it. */
export async function loadProfile(ctx: ProfileContext): Promise<ProfileView | null> {
  const res = await ords<unknown>("/profiles/me", { token: ctx.session.token });
  if (!res.ok) return null;
  const profile = normalizeDoc(res.data, ctx.role, ctx.session.fullName);
  return { profile, completion: completion(profile) };
}

/**
 * The publish gate, enforced here as well as in the database: a profile below 100% is never live.
 * Run after every write; if the write dropped completion, the profile is unpublished.
 */
export async function enforcePublishGate(ctx: ProfileContext, view: ProfileView): Promise<ProfileView> {
  if (!view.profile.published || view.completion.pct === 100) return view;
  await ords("/profiles/me/publish", { method: "DELETE", token: ctx.session.token });
  const profile = { ...view.profile, published: false };
  return { profile, completion: view.completion };
}

export const view = (v: ProfileView) => ({ profile: v.profile, completion: v.completion });
