/** Pick lists. Illustrative until the lookup tables (`GCODE_DOMAINS`, `GCODE_SKILLS`, `GCODE_SERVICE_TYPES`) are seeded. */

export const DOMAINS = [
  "Information Technology (IT)",
  "Consulting",
  "Business Development",
  "Business Transformation",
  "Finance",
  "Healthcare",
  "Media and Entertainment",
  "Education",
  "Manufacturing",
  "Others",
];

export const SKILL_SUGGESTIONS = [
  "Python",
  "Product Management",
  "Data Analysis",
  "Cloud",
  "UI/UX Design",
  "Marketing",
  "Excel",
  "SQL",
  "Leadership",
];

export const SERVICE_TYPES = [
  "Advisory to startups, MSMEs and scaleups",
  "Guide on research inputs & insights",
  "Help interns on projects",
  "Career mentoring & guidance",
  "Guest lectures & talks",
];

export const DURATIONS = ["15 min", "30 min", "45 min", "1 hr"];
export const BUFFERS = ["No buffer", "5 min", "10 min", "15 min", "30 min"];

export const STARTUP_STAGES = ["Idea", "Prototype / MVP", "Early revenue", "Growth", "Scale-up"];
export const FUNDING_STATUS = ["Bootstrapped", "Pre-seed", "Seed", "Series A", "Series B+"];
export const INSTITUTE_TYPES = ["University", "College", "School", "Research institute", "Training academy", "Other"];

/** 30-minute steps, 07:00 to 21:00. */
export const TIME_OPTS = Array.from({ length: 29 }, (_, i) => {
  const m = 7 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
