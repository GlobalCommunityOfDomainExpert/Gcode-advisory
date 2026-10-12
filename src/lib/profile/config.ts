import type { Completion, ProfileDoc, ProfileRole, SectionId } from "./types";

/** Tabs per stakeholder, in order (from the wireframe's `profile-config`). */
export const TABS: Record<ProfileRole, { id: SectionId; label: string }[]> = {
  expert: [
    { id: "basic", label: "Basic info" },
    { id: "expertise", label: "Expertise" },
    { id: "journey", label: "Career & education" },
    { id: "about", label: "About you" },
    { id: "services", label: "Services" },
  ],
  intern: [
    { id: "basic", label: "Basic info" },
    { id: "profile", label: "Your profile" },
    { id: "journey", label: "Career & education" },
    { id: "projects", label: "Projects" },
  ],
  startup: [
    { id: "basic", label: "Basic info" },
    { id: "pitch", label: "Elevator pitch" },
    { id: "company", label: "Company details" },
    { id: "team", label: "Team & contacts" },
  ],
  institute: [
    { id: "basic", label: "Basic info" },
    { id: "info", label: "Institute info" },
    { id: "contact", label: "Contact info" },
  ],
};

export const TAB_DESC: Record<SectionId, string> = {
  basic: "Your public name and photo. Your email and phone are private: they live in Settings.",
  expertise: "What you’re known for, so the right people can find you.",
  journey: "Where you’ve worked and studied.",
  about: "Introduce yourself in your own words.",
  services: "What you offer, at what rate, and when people can book you.",
  profile: "A snapshot of who you are and what you’re looking for.",
  projects: "Show what you’ve built.",
  pitch: "A short paragraph on what you’re building and why it matters.",
  company: "The key facts experts and partners look for.",
  team: "Who should GCODE and experts get in touch with?",
  info: "How your institute appears on GCODE.",
  contact: "Who should we reach out to?",
};

/** Who can see each tab once the profile is published. Default: everyone. Business contacts only after contact. */
export const TAB_VISIBILITY: Partial<Record<SectionId, "contact">> = { team: "contact", contact: "contact" };

export const sectionsFor = (role: ProfileRole): SectionId[] => TABS[role].map((t) => t.id);

/**
 * The checks behind each tab's `filled / total`. Copied from the wireframe; the server runs the same function, so a
 * client can never claim 100% or publish an incomplete profile.
 */
export function tabChecks(doc: ProfileDoc, id: SectionId): boolean[] {
  const { fields: f, lists: L, files, services } = doc;
  const has = (k: string) => !!(f[k] ?? "").trim();
  const any = (n: keyof typeof L) => L[n].length > 0;
  const rows = (n: "career" | "education" | "projects" | "contacts") =>
    (L[n] as unknown as Record<string, string>[]).some((e) => (Object.values(e)[0] ?? "").trim() !== "");

  switch (id) {
    case "basic":
      return [has("fullName"), !!files.photo];
    case "expertise":
      return [any("domains"), has("currentTitle"), any("skills"), has("engagement")];
    case "journey":
      return [rows("career"), rows("education")];
    case "about":
      return [has("bio"), has("pitch")];
    case "services":
      return f.engagement === "community"
        ? [true, true]
        : [services.length > 0 && services.every((s) => s.type), services.some((s) => s.rate !== "" && Object.values(s.days).some((d) => d.on))];
    case "profile":
      return [has("currentTitle"), any("skills"), has("bio"), has("pitch")];
    case "projects":
      return [rows("projects")];
    case "pitch":
      return [has("pitch")];
    case "company":
      return [has("stage"), has("funding"), has("teamSize"), has("industry"), has("location"), has("linkedin"), has("domain"), !!files.deck];
    case "team":
      return [rows("contacts")];
    case "info":
      return [has("instName"), has("website"), has("instType"), has("about"), !!files.banner, !!files.logo];
    case "contact":
      return [has("cName"), has("cEmail"), has("cPhone")];
  }
}

export function completion(doc: ProfileDoc): Completion {
  const per = TABS[doc.role].map((t) => {
    const checks = tabChecks(doc, t.id);
    return { ...t, filled: checks.filter(Boolean).length, total: checks.length };
  });
  const filled = per.reduce((n, t) => n + t.filled, 0);
  const total = per.reduce((n, t) => n + t.total, 0);
  return { per, pct: Math.round((filled / total) * 100) };
}

/** Index of the first incomplete tab, or -1. */
export const nextStep = (c: Completion) => c.per.findIndex((p) => p.filled < p.total);

/** Where a published profile appears. */
export const listedIn = (role: ProfileRole) => (role === "expert" ? "Find Experts" : "the GCODE community");

export function emptyProfile(role: ProfileRole, fullName: string): ProfileDoc {
  return {
    role,
    fields: { fullName },
    lists: { domains: [], skills: [], career: [], education: [], projects: [], contacts: [] },
    services: [],
    daysOff: [],
    files: {},
    published: false,
    payoutSet: false,
    paymentsEnabled: false,
  };
}
