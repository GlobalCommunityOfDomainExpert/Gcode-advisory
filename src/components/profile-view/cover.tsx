import type { ReactNode } from "react";

// Red is reserved for errors and calls to action, so covers use blue, green and amber. Each is a soft gradient of the brand
// colour: lively enough to read as a banner, light enough that the avatar, pills and text on top stay easy to read.
const TONES = [
  "from-blue-700/30 to-blue-500/20", // blue, the navy family but with colour in it
  "from-success/32 to-success/20", // green
  "from-warning/38 to-warning/22", // amber
];

/** The same name always gets the same cover, so a person looks the same in the directory and on their own page. */
export const coverTone = (name: string) => TONES[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];

/** The banner behind a person's photo: a tinted gradient with two soft circles. Used by directory cards and the profile intro. */
export function Cover({ name, className = "", children }: { name: string; className?: string; children?: ReactNode }) {
  return (
    <div className={`${coverTone(name)} relative overflow-hidden bg-linear-to-br ${className}`}>
      <span aria-hidden="true" className="absolute -top-16 -right-10 size-56 rounded-full bg-white/30" />
      <span aria-hidden="true" className="absolute -bottom-20 -left-10 size-48 rounded-full bg-white/22" />
      {children}
    </div>
  );
}
