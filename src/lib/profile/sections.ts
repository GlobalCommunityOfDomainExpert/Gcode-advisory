import { isEmail } from "@/lib/auth/validators";
import { sectionsFor, emptyProfile } from "./config";
import {
  BUFFERS,
  DOMAINS,
  DURATIONS,
  FUNDING_STATUS,
  INSTITUTE_TYPES,
  SERVICE_TYPES,
  STARTUP_STAGES,
  TIME_OPTS,
} from "./options";
import {
  DAY_KEYS,
  type ContactItem,
  type DayOff,
  type FileKind,
  type FileRef,
  type ProfileDoc,
  type ProfileLists,
  type ProfileRole,
  type SectionId,
  type Service,
} from "./types";

/**
 * Validation for every profile write. The BFF runs it on each request (the browser's checks are only hints), and
 * `normalizeDoc` runs it on what the backend returns so a bad row can never break the page.
 */

export interface SectionPatch {
  fields?: Record<string, string>;
  lists?: Partial<ProfileLists>;
  services?: Service[];
  daysOff?: DayOff[];
}

export type ParseResult = { ok: true; patch: SectionPatch } | { ok: false; error: string };

const bad = (error: string): ParseResult => ({ ok: false, error });

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

/** Trimmed text with control characters removed. Newlines survive in multi-line fields. */
function text(value: unknown, max: number, multiline = false): string | null {
  if (typeof value !== "string") return value === undefined || value === null ? "" : null;
  const cleaned = value.replace(multiline ? /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g, "").trim();
  return cleaned.length <= max ? cleaned : null;
}

/** http(s) URLs only. "example.com" becomes "https://example.com". javascript:, data: and the rest are refused. */
function url(value: unknown): string | null {
  const raw = text(value, 300);
  if (raw === null) return null;
  if (raw === "") return "";
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(candidate);
    return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

function oneOf(value: unknown, allowed: string[]): string | null {
  if (value === undefined || value === null || value === "") return "";
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

function stringList(value: unknown, max: number, itemMax: number, allowed?: string[]): string[] | null {
  if (!Array.isArray(value) || value.length > max) return null;
  const out: string[] = [];
  for (const item of value) {
    const t = text(item, itemMax);
    if (!t) return null;
    if (allowed && !allowed.includes(t)) return null;
    if (!out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out;
}

function rowsOf<T>(value: unknown, max: number, parse: (row: Obj) => T | null, isBlank: (row: T) => boolean): T[] | null {
  if (!Array.isArray(value) || value.length > max) return null;
  const out: T[] = [];
  for (const raw of value) {
    if (!isObj(raw)) return null;
    const row = parse(raw);
    if (!row) return null;
    if (!isBlank(row)) out.push(row);
  }
  return out;
}

const blank = (row: object) => Object.values(row).every((v) => String(v).trim() === "");

function parseService(raw: Obj): Service | null {
  const type = oneOf(raw.type, SERVICE_TYPES);
  const contribution = text(raw.contribution, 500, true);
  const duration = oneOf(raw.duration, DURATIONS);
  const buffer = oneOf(raw.buffer, BUFFERS);
  const rateRaw = typeof raw.rate === "number" ? String(raw.rate) : raw.rate;
  const rate = typeof rateRaw === "string" ? rateRaw.trim() : rateRaw === undefined || rateRaw === null ? "" : null;
  if (type === null || contribution === null || !duration || !buffer || rate === null) return null;
  if (rate !== "" && !(/^\d{1,6}$/.test(rate) && Number(rate) <= 100_000)) return null;
  const mode = raw.mode === "until" ? "until" : "rolling";
  const from = raw.from === "" || raw.from === undefined ? "" : isDate(raw.from) ? raw.from : null;
  const to = raw.to === "" || raw.to === undefined ? "" : isDate(raw.to) ? raw.to : null;
  if (from === null || to === null || (from && to && to < from)) return null;
  if (!isObj(raw.days)) return null;
  const days = {} as Service["days"];
  for (const k of DAY_KEYS) {
    const d = raw.days[k];
    if (!isObj(d)) return null;
    const s = typeof d.s === "string" ? d.s : "";
    const e = typeof d.e === "string" ? d.e : "";
    if (!TIME_OPTS.includes(s) || !TIME_OPTS.includes(e)) return null;
    if (d.on === true && e <= s) return null;
    days[k] = { on: d.on === true, s, e };
  }
  return { type, contribution, duration, buffer, rate: String(rate === "" ? "" : Number(rate)), mode, from, to, days };
}

function parseDaysOff(value: unknown): DayOff[] | null {
  if (!Array.isArray(value) || value.length > 50) return null;
  const out: DayOff[] = [];
  for (const raw of value) {
    if (!isObj(raw) || !isDate(raw.from) || !isDate(raw.to) || raw.to < raw.from) return null;
    out.push({ from: raw.from, to: raw.to });
  }
  return out;
}

/** Collects `fields` from `spec` ({ key: parser }). Missing keys are left out of the patch, not blanked. */
function pickFields(body: Obj, spec: Record<string, (v: unknown) => string | null>, labels: Record<string, string>): { fields: Record<string, string> } | string {
  const fields: Record<string, string> = {};
  for (const [key, parse] of Object.entries(spec)) {
    if (!(key in body)) continue;
    const value = parse(body[key]);
    if (value === null) return `${labels[key] ?? key} is not valid.`;
    fields[key] = value;
  }
  return { fields };
}

const short = (max: number) => (v: unknown) => text(v, max);
const long = (max: number) => (v: unknown) => text(v, max, true);

export function parseSection(role: ProfileRole, section: SectionId, body: unknown): ParseResult {
  if (!sectionsFor(role).includes(section)) return bad("That section isn’t part of your profile.");
  if (!isObj(body)) return bad("Invalid request.");

  const fieldsOnly = (spec: Record<string, (v: unknown) => string | null>, labels: Record<string, string>, required: string[] = []): ParseResult => {
    const r = pickFields(body, spec, labels);
    if (typeof r === "string") return bad(r);
    for (const k of required) if (k in r.fields && r.fields[k] === "") return bad(`${labels[k] ?? k} can’t be empty.`);
    return { ok: true, patch: { fields: r.fields } };
  };

  switch (section) {
    case "basic":
      return fieldsOnly(
        role === "startup" ? { fullName: (v) => short(100)(v) } : { fullName: short(100), location: short(120) },
        { fullName: "Full name", location: "Location" },
        ["fullName"],
      );
    case "expertise": {
      const r = pickFields(body, { engagement: (v) => oneOf(v, ["paid", "free", "community"]), currentTitle: short(120) }, { engagement: "Participation", currentTitle: "Current title" });
      if (typeof r === "string") return bad(r);
      const lists: Partial<ProfileLists> = {};
      if ("domains" in body) {
        const d = stringList(body.domains, 10, 60, DOMAINS);
        if (!d) return bad("Choose domains from the list.");
        lists.domains = d;
      }
      if ("skills" in body) {
        const s = stringList(body.skills, 30, 40);
        if (!s) return bad("Skills must be short text, up to 30 of them.");
        lists.skills = s;
      }
      return { ok: true, patch: { fields: r.fields, lists } };
    }
    case "profile": {
      const r = pickFields(body, { currentTitle: short(120), bio: long(600), pitch: long(300) }, { currentTitle: "Current title", bio: "Bio", pitch: "Elevator pitch" });
      if (typeof r === "string") return bad(r);
      const lists: Partial<ProfileLists> = {};
      if ("skills" in body) {
        const s = stringList(body.skills, 30, 40);
        if (!s) return bad("Skills must be short text, up to 30 of them.");
        lists.skills = s;
      }
      return { ok: true, patch: { fields: r.fields, lists } };
    }
    case "about":
      return fieldsOnly({ bio: long(600), pitch: long(300) }, { bio: "Bio", pitch: "Elevator pitch" });
    case "pitch":
      return fieldsOnly({ pitch: long(300) }, { pitch: "Elevator pitch" });
    case "company":
      return fieldsOnly(
        {
          stage: (v) => oneOf(v, STARTUP_STAGES),
          funding: (v) => oneOf(v, FUNDING_STATUS),
          teamSize: (v) => {
            const t = typeof v === "number" ? String(v) : text(v, 6);
            return t === "" || (t !== null && /^[1-9]\d{0,5}$/.test(t)) ? t : null;
          },
          industry: (v) => oneOf(v, DOMAINS),
          location: short(120),
          linkedin: (v) => {
            const u = url(v);
            return u === null || (u !== "" && !/(^|\.)linkedin\.com$/i.test(new URL(u).hostname)) ? null : u;
          },
          domain: url,
        },
        { stage: "Startup stage", funding: "Funding status", teamSize: "Team size", industry: "Industry", location: "Location", linkedin: "LinkedIn page (a linkedin.com address)", domain: "Public domain" },
      );
    case "info":
      return fieldsOnly(
        { instName: short(150), instType: (v) => oneOf(v, INSTITUTE_TYPES), website: url, about: long(800) },
        { instName: "Institute name", instType: "Type of institute", website: "Official website", about: "About the institute" },
      );
    case "contact":
      return fieldsOnly(
        {
          cName: short(100),
          cEmail: (v) => {
            const e = text(v, 254);
            return e === null || (e !== "" && !isEmail(e.toLowerCase())) ? null : (e ?? "").toLowerCase();
          },
          cPhone: (v) => {
            const p = text(v, 20);
            return p === null || (p !== "" && !/^[+\d][\d\s()-]{5,19}$/.test(p)) ? null : p;
          },
        },
        { cName: "Contact name", cEmail: "Contact email", cPhone: "Contact phone" },
      );
    case "journey": {
      const lists: Partial<ProfileLists> = {};
      if ("career" in body) {
        const rows = rowsOf(
          body.career,
          20,
          (r) => {
            const title = text(r.title, 120), org = text(r.org, 120), period = text(r.period, 60), desc = text(r.desc, 500, true);
            return title === null || org === null || period === null || desc === null ? null : { title, org, period, desc };
          },
          blank,
        );
        if (!rows) return bad("Check the career entries (text is too long or malformed).");
        lists.career = rows;
      }
      if ("education" in body) {
        const rows = rowsOf(
          body.education,
          20,
          (r) => {
            const institution = text(r.institution, 150), degree = text(r.degree, 120), period = text(r.period, 60);
            return institution === null || degree === null || period === null ? null : { institution, degree, period };
          },
          blank,
        );
        if (!rows) return bad("Check the education entries (text is too long or malformed).");
        lists.education = rows;
      }
      return { ok: true, patch: { lists } };
    }
    case "projects": {
      const rows = rowsOf(
        body.projects,
        20,
        (r) => {
          const title = text(r.title, 120), desc = text(r.desc, 500, true), link = url(r.link);
          return title === null || desc === null || link === null ? null : { title, desc, link };
        },
        blank,
      );
      return rows ? { ok: true, patch: { lists: { projects: rows } } } : bad("Check the projects: links must be web addresses.");
    }
    case "team": {
      const rows = rowsOf<ContactItem>(
        body.contacts,
        10,
        (r) => {
          const name = text(r.name, 100), role2 = text(r.role, 100), email = text(r.email, 254), phone = text(r.phone, 20);
          if (name === null || role2 === null || email === null || phone === null) return null;
          if (email !== "" && !isEmail(email.toLowerCase())) return null;
          if (phone !== "" && !/^[+\d][\d\s()-]{5,19}$/.test(phone)) return null;
          return { name, role: role2, email: email.toLowerCase(), phone };
        },
        blank,
      );
      return rows ? { ok: true, patch: { lists: { contacts: rows } } } : bad("Check the contacts: email or phone looks invalid.");
    }
    case "services": {
      const patch: SectionPatch = {};
      if ("engagement" in body) {
        const e = oneOf(body.engagement, ["paid", "free", "community"]);
        if (e === null) return bad("Participation is not valid.");
        patch.fields = { engagement: e };
      }
      if ("services" in body) {
        if (!Array.isArray(body.services) || body.services.length > 10) return bad("You can add up to 10 services.");
        const services: Service[] = [];
        for (const raw of body.services) {
          const s = isObj(raw) ? parseService(raw) : null;
          if (!s) return bad("Check the services: a rate, hours or date looks invalid.");
          services.push(s);
        }
        patch.services = services;
      }
      if ("daysOff" in body) {
        const d = parseDaysOff(body.daysOff);
        if (!d) return bad("Check the days off: dates must be valid and in order.");
        patch.daysOff = d;
      }
      return { ok: true, patch };
    }
  }
}

export function applyPatch(doc: ProfileDoc, patch: SectionPatch): ProfileDoc {
  return {
    ...doc,
    fields: { ...doc.fields, ...patch.fields },
    lists: { ...doc.lists, ...patch.lists },
    services: patch.services ?? doc.services,
    daysOff: patch.daysOff ?? doc.daysOff,
  };
}

const FILE_KINDS_BY_ROLE: Record<ProfileRole, FileKind[]> = {
  expert: ["photo"],
  intern: ["photo"],
  startup: ["photo", "deck"],
  institute: ["photo", "banner", "logo"],
};
export const fileKindsFor = (role: ProfileRole) => FILE_KINDS_BY_ROLE[role];

/**
 * Turns whatever the backend returned into a well-formed document. Anything missing or malformed falls back to empty,
 * so the page renders and the completion check still holds.
 */
export function normalizeDoc(raw: unknown, role: ProfileRole, fallbackName: string): ProfileDoc {
  const base = emptyProfile(role, fallbackName);
  if (!isObj(raw)) return base;

  const fields: Record<string, string> = { ...base.fields };
  if (isObj(raw.fields)) for (const [k, v] of Object.entries(raw.fields)) if (typeof v === "string" && k.length < 40) fields[k] = v.slice(0, 1000);

  const lists = { ...base.lists };
  if (isObj(raw.lists)) {
    const l = raw.lists;
    lists.domains = stringList(l.domains, 10, 60) ?? [];
    lists.skills = stringList(l.skills, 30, 40) ?? [];
    for (const key of ["career", "education", "projects", "contacts"] as const) {
      const arr = Array.isArray(l[key]) ? (l[key] as unknown[]) : [];
      lists[key] = arr.filter(isObj).slice(0, 20).map((r) => Object.fromEntries(Object.entries(r).filter(([, v]) => typeof v === "string"))) as never;
    }
  }

  const services: Service[] = [];
  if (Array.isArray(raw.services)) for (const s of raw.services.slice(0, 10)) if (isObj(s)) { const p = parseService(s); if (p) services.push(p); }

  const files: ProfileDoc["files"] = {};
  if (isObj(raw.files)) {
    for (const kind of FILE_KINDS_BY_ROLE[role]) {
      const f = raw.files[kind];
      if (isObj(f) && typeof f.name === "string" && typeof f.url === "string") files[kind] = { name: f.name.slice(0, 200), url: f.url } satisfies FileRef;
    }
  }

  return {
    role,
    fields,
    lists,
    services,
    daysOff: parseDaysOff(raw.daysOff) ?? [],
    files,
    published: raw.published === true,
    payoutSet: raw.payoutSet === true,
  };
}

/** What the browser sends when it saves a tab: just that tab's keys, taken from the working copy. */
export function sectionBody(doc: ProfileDoc, section: SectionId): Record<string, unknown> {
  const f = doc.fields;
  const pick = (...keys: string[]) => Object.fromEntries(keys.map((k) => [k, f[k] ?? ""]));
  switch (section) {
    case "basic":
      return doc.role === "startup" ? pick("fullName") : pick("fullName", "location");
    case "expertise":
      return { ...pick("engagement", "currentTitle"), domains: doc.lists.domains, skills: doc.lists.skills };
    case "journey":
      return { career: doc.lists.career, education: doc.lists.education };
    case "about":
      return pick("bio", "pitch");
    case "services":
      return { engagement: f.engagement ?? "", services: doc.services, daysOff: doc.daysOff };
    case "profile":
      return { ...pick("currentTitle", "bio", "pitch"), skills: doc.lists.skills };
    case "projects":
      return { projects: doc.lists.projects };
    case "pitch":
      return pick("pitch");
    case "company":
      return pick("stage", "funding", "teamSize", "industry", "location", "linkedin", "domain");
    case "team":
      return { contacts: doc.lists.contacts };
    case "info":
      return pick("instName", "instType", "website", "about");
    case "contact":
      return pick("cName", "cEmail", "cPhone");
  }
}
