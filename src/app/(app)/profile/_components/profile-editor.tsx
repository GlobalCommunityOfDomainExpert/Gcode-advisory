"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, CalendarClock, CircleCheck, Contact, FolderKanban, Globe, Landmark, LoaderCircle, Lightbulb, MessageSquareText, Target, UserRound, UserRoundPen, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar, Badge, Button } from "@/components/atoms";
import { PageHeader } from "@/components/layout";
import { Banner, IconTile, ProgressRing, Tabs } from "@/components/molecules";
import { ProfileSectionNav, VisibilityBar, VisibilityTag } from "@/components/domain";
import { completion, listedIn, nextStep, TAB_DESC, TAB_VISIBILITY, TABS } from "@/lib/profile/config";
import { sectionBody } from "@/lib/profile/sections";
import { ROLE_LABEL, type Completion, type FileKind, type ProfileDoc, type ProfileLists, type SectionId } from "@/lib/profile/types";
import { TabBody, type TabContext } from "./tab-bodies";

const TAB_ICON: Record<SectionId, LucideIcon> = {
  basic: UserRound,
  expertise: Target,
  journey: BriefcaseBusiness,
  about: MessageSquareText,
  services: CalendarClock,
  profile: UserRoundPen,
  projects: FolderKanban,
  pitch: Lightbulb,
  company: Building2,
  team: Users,
  info: Landmark,
  contact: Contact,
};

interface ApiView {
  profile: ProfileDoc;
  completion: Completion;
}

async function call(method: string, path: string, body?: unknown, form?: FormData): Promise<{ ok: true; data: ApiView } | { ok: false; status: number; error: string }> {
  try {
    const res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: form ? undefined : { "Content-Type": "application/json" },
      body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, status: res.status, error: json?.error ?? (res.status === 429 ? "Too many attempts. Please wait a moment." : "Something went wrong. Please try again.") };
    return { ok: true, data: json as ApiView };
  } catch {
    return { ok: false, status: 0, error: "Network problem. Check your connection and try again." };
  }
}

/** The app scrolls inside <main id="app-scroll-region">, not the window, so window.scrollTo does nothing here. */
function scrollToTop() {
  const region = document.getElementById("app-scroll-region");
  (region ?? window).scrollTo({ top: 0, behavior: "smooth" });
}

export function ProfileEditor({ initial, initialTab, displayName, accountEmail }: { initial: ProfileDoc; initialTab: SectionId | null; displayName: string; accountEmail?: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<ProfileDoc>(initial);
  const sections = TABS[doc.role];
  const [tab, setTab] = useState(() => Math.max(0, sections.findIndex((t) => t.id === initialTab)));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState<FileKind | null>(null);
  const [uploadError, setUploadError] = useState<TabContext["uploadError"]>(null);

  // Completion is computed live from the working copy; the server computes the same thing on every save and publish.
  const live = useMemo(() => completion(doc), [doc]);
  const section = sections[tab];
  const per = live.per[tab];
  const last = tab === sections.length - 1;
  const next = nextStep(live);

  // URL keeps the open tab across reloads.
  useEffect(() => {
    window.history.replaceState(null, "", `?tab=${section.id}`);
  }, [section.id]);

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const edit = useCallback((fn: (d: ProfileDoc) => ProfileDoc) => {
    setDoc(fn);
    setDirty(true);
    setSaved(false);
  }, []);

  const ctx: TabContext = {
    doc,
    setField: (key, value) => edit((d) => ({ ...d, fields: { ...d.fields, [key]: value } })),
    setList: (key: keyof ProfileLists, rows) => edit((d) => ({ ...d, lists: { ...d.lists, [key]: rows } })),
    setServices: (services) => edit((d) => ({ ...d, services })),
    setDaysOff: (daysOff) => edit((d) => ({ ...d, daysOff })),
    uploading,
    uploadError,
    upload: async (kind, file) => {
      setUploading(kind);
      setUploadError(null);
      const form = new FormData();
      form.append("file", file);
      const res = await call("POST", `/api/profile/files/${kind}`, undefined, form);
      setUploading(null);
      if (!res.ok) return setUploadError({ kind, message: res.error });
      // Only files and the publish state come back into the working copy; unsaved text edits stay as typed.
      setDoc((d) => ({ ...d, files: res.data.profile.files, published: res.data.profile.published }));
      router.refresh(); // the sidebar and navbar show the saved completion
    },
  };

  /** Saves the open tab. Returns false (and shows why) when the server refuses it. */
  async function saveCurrent(): Promise<boolean> {
    if (!dirty) return true;
    setSaving(true);
    setError(null);
    const res = await call("PUT", `/api/profile/${section.id}`, sectionBody(doc, section.id));
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      scrollToTop(); // the message sits at the top of the card; the Save button is at the bottom
      return false;
    }
    setDoc(res.data.profile);
    setDirty(false);
    router.refresh(); // the sidebar and the nudge banner read the saved completion
    return true;
  }

  /** Opens another tab and brings the top of the new one into view. */
  function open(index: number) {
    setTab(index);
    setSaved(false);
    scrollToTop();
  }

  async function go(index: number) {
    if (index === tab) return;
    if (await saveCurrent()) open(index);
  }

  async function saveAndContinue() {
    if (!(await saveCurrent())) return;
    if (last) {
      setSaved(true);
      scrollToTop(); // show the "Profile saved" banner, even when nothing had changed
    } else open(tab + 1);
  }

  async function setPublished(publish: boolean) {
    if (!(await saveCurrent())) return;
    setPublishing(true);
    setError(null);
    const res = await call(publish ? "POST" : "DELETE", "/api/profile/publish", {});
    setPublishing(false);
    if (!res.ok) {
      setError(res.error);
      scrollToTop();
      return;
    }
    setDoc(res.data.profile);
    router.refresh();
  }

  const items = live.per.map((p) => ({ id: p.id, label: p.label, icon: TAB_ICON[p.id], filled: p.filled, total: p.total }));
  const doneSections = live.per.filter((p) => p.filled === p.total).length;
  const sectionsLeft = live.per.length - doneSections;
  const heading = doc.role === "institute" ? doc.fields.instName || displayName : displayName;
  const visibility = TAB_VISIBILITY[section.id] ?? "public";

  return (
    <>
      <PageHeader eyebrow="My profile" title="Complete your profile" subtitle="A complete profile helps others find and trust you." />

      <div className="space-y-6 pb-8">
        <div className="bg-surface-light ring-primary/10 flex flex-col gap-5 rounded-lg p-5 shadow-sm ring-1 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar alt={heading} src={doc.files.photo?.url} size="xl" />
            <div className="min-w-0 space-y-1">
              <h2 className="text-heading text-text-primary truncate font-bold">{heading}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary" size="sm">
                  {ROLE_LABEL[doc.role]}
                </Badge>
                {accountEmail && (
                  <Badge tone="success" size="sm">
                    Email verified
                  </Badge>
                )}
              </div>
              <p className="text-small text-text-secondary flex items-center gap-1.5">
                <Globe className="size-3.5" aria-hidden="true" />
                This is how you appear on your public profile
              </p>
            </div>
          </div>
          <div className="border-border-light flex items-center gap-4 sm:border-l sm:pl-6">
            <ProgressRing value={live.pct} sizeClassName="size-16" />
            <div className="min-w-36">
              <p className="text-body text-text-primary font-semibold">Profile completion</p>
              <p className="text-small text-text-secondary">
                {doneSections} of {live.per.length} sections done
              </p>
              {next < 0 ? (
                <p className="text-small text-success mt-1 flex items-center gap-1.5 font-semibold">
                  <CircleCheck className="size-4" aria-hidden="true" /> All sections complete
                </p>
              ) : (
                <>
                  <p className="text-small text-text-secondary mt-1">Up next</p>
                  <button type="button" onClick={() => go(next)} className="text-body text-primary focus-visible:ring-primary inline-flex items-center gap-1 rounded-sm font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
                    {live.per[next].label} <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <VisibilityBar published={doc.published} percent={live.pct} sectionsLeft={sectionsLeft} where={listedIn(doc.role)} busy={publishing} onPublish={() => setPublished(true)} onUnpublish={() => setPublished(false)} />

        <div className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <nav aria-label="Profile sections" className="bg-surface-light ring-primary/10 sticky top-6 hidden space-y-1 rounded-lg p-2 shadow-sm ring-1 lg:block">
            <ProfileSectionNav items={items} active={tab} onSelect={go} />
          </nav>

          <div className="min-w-0 space-y-4">
            <div className="lg:hidden">
              <Tabs items={sections.map((s, i) => ({ value: String(i), label: s.label }))} value={String(tab)} onChange={(v) => go(Number(v))} />
            </div>

            <section aria-labelledby="tab-title" className="bg-surface-light ring-primary/10 rounded-lg shadow-sm ring-1">
              <div className="border-border-light flex items-center gap-3 border-b px-6 py-4">
                <IconTile icon={TAB_ICON[section.id]} tone="primary" size="lg" />
                <div className="min-w-0 flex-1">
                  <h3 id="tab-title" className="text-large text-text-primary font-bold">
                    {section.label}
                  </h3>
                  <p className="text-small text-text-secondary">{TAB_DESC[section.id]}</p>
                </div>
                <VisibilityTag type={visibility} />
                <span className="text-small text-text-secondary bg-bg-subtle border-border-light hidden shrink-0 rounded-full border px-2.5 py-0.5 font-medium sm:inline">
                  Step {tab + 1} of {sections.length}
                </span>
              </div>

              <div className="relative space-y-5 p-6" aria-busy={saving || publishing}>
                {(saving || publishing) && (
                  <div className="bg-surface-light/70 absolute inset-0 z-10 flex items-start justify-center rounded-b-lg pt-24 backdrop-blur-[1px]" role="status">
                    <span className="bg-surface-light text-small text-text-primary ring-primary/10 flex items-center gap-2 rounded-full px-4 py-2 font-semibold shadow-md ring-1">
                      <LoaderCircle className="text-primary size-4 motion-safe:animate-spin" aria-hidden="true" /> {publishing ? "Updating visibility…" : "Saving…"}
                    </span>
                  </div>
                )}
                {saved && (
                  <Banner tone="success">
                    {live.pct === 100 ? (doc.published ? "Profile saved. Your profile is complete and live." : "Profile saved. Your profile is complete: publish it above to go live.") : `Profile saved. You’re ${live.pct}% complete: ${sectionsLeft} section${sectionsLeft === 1 ? "" : "s"} left before you can publish.`}{" "}
                    <Link href="/directory" className="font-bold underline underline-offset-2">
                      Go to the directory
                    </Link>
                  </Banner>
                )}
                {error && (
                  <Banner tone="danger" onDismiss={() => setError(null)}>
                    {error}
                  </Banner>
                )}
                <TabBody section={section.id} ctx={ctx} />
                <p className="text-small text-text-secondary sr-only" aria-live="polite">
                  {per.filled} of {per.total} fields done in this section
                </p>
              </div>

              <div className="border-border-light bg-bg-subtle flex items-center justify-between gap-2 rounded-b-md border-t px-6 py-3.5">
                {tab > 0 ? (
                  <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => go(tab - 1)}>
                    <ArrowLeft className="size-4" aria-hidden="true" /> Back
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-3">
                  <p role="status" aria-live="polite" className="text-small flex items-center gap-1.5 font-medium">
                    {dirty ? (
                      <span className="text-warning flex items-center gap-1.5">
                        <span className="bg-warning size-2 rounded-full motion-safe:animate-pulse" aria-hidden="true" /> Unsaved changes
                      </span>
                    ) : (
                      last &&
                      saved && (
                        <span className="text-success flex items-center gap-1.5">
                          <CircleCheck className="size-4" aria-hidden="true" /> All changes saved
                        </span>
                      )
                    )}
                  </p>
                  {/* Nothing to save, so Save is off on every tab. Earlier tabs get a plain Next so you can still move on. */}
                  {!last && !dirty && (
                    <Button type="button" variant="outline" disabled={saving} onClick={() => open(tab + 1)}>
                      Next <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  )}
                  <Button type="button" loading={saving} disabled={!dirty} onClick={saveAndContinue} className={dirty ? "motion-safe:animate-[pulse_1.6s_ease-in-out_2]" : undefined}>
                    {last ? (doc.published ? "Save & publish" : "Save profile") : "Save & continue"}
                    {!last && <ArrowRight className="size-4" aria-hidden="true" />}
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

