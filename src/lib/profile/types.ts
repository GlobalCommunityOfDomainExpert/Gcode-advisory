/** The four stakeholder profiles. Everything below is shared by the browser, the BFF routes and the mock backend. */

export type ProfileRole = "expert" | "intern" | "startup" | "institute";

/** `GCODE_ROLES.ROLE_NAME` (what the session carries) → profile role. */
export const ROLE_BY_NAME: Record<string, ProfileRole> = {
  EXPERT: "expert",
  FRESHER: "intern",
  STARTUP: "startup",
  INSTITUTION: "institute",
};

export const ROLE_LABEL: Record<ProfileRole, string> = {
  expert: "Domain Expert",
  intern: "Fresher / Intern",
  startup: "Startup / MSME",
  institute: "Institution",
};

export type Engagement = "paid" | "free" | "community";

export interface CareerItem {
  title: string;
  org: string;
  period: string;
  desc: string;
}
export interface EducationItem {
  institution: string;
  degree: string;
  period: string;
}
export interface ProjectItem {
  title: string;
  desc: string;
  link: string;
}
export interface ContactItem {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type DayKey = (typeof DAY_KEYS)[number];
export interface DayHours {
  on: boolean;
  /** "HH:MM", 24-hour, IST. */
  s: string;
  e: string;
}

/** One bookable service: what is offered, how long, at what rate, and when. */
export interface Service {
  type: string;
  contribution: string;
  duration: string;
  buffer: string;
  /** "" = not set, "0" = free, otherwise whole rupees. */
  rate: string;
  /** rolling = always open for the next 60 days; until = fixed window. */
  mode: "rolling" | "until";
  from: string;
  to: string;
  days: Record<DayKey, DayHours>;
}

export interface DayOff {
  from: string;
  to: string;
}

export type FileKind = "photo" | "banner" | "logo" | "deck";
export interface FileRef {
  name: string;
  url: string;
}

export interface ProfileLists {
  domains: string[];
  skills: string[];
  career: CareerItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  contacts: ContactItem[];
}

export interface ProfileDoc {
  role: ProfileRole;
  fields: Record<string, string>;
  lists: ProfileLists;
  services: Service[];
  daysOff: DayOff[];
  files: Partial<Record<FileKind, FileRef>>;
  published: boolean;
  /** The public address /experts/<publicSlug>. Present while an expert's profile is published. */
  publicSlug?: string;
  /** Does this expert have a payout account? Paid services stay paused without one. */
  payoutSet: boolean;
  /** false while only free sessions can be booked: the editor hides prices and the paid option. */
  paymentsEnabled: boolean;
}

export type SectionId =
  | "basic"
  | "expertise"
  | "journey"
  | "about"
  | "services"
  | "profile"
  | "projects"
  | "pitch"
  | "company"
  | "team"
  | "info"
  | "contact";

export interface SectionProgress {
  id: SectionId;
  label: string;
  filled: number;
  total: number;
}

export interface Completion {
  per: SectionProgress[];
  pct: number;
}
