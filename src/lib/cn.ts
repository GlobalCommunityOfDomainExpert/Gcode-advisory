/** Joins class names, skipping falsy values. Keeps conditional classes readable without stray spaces. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
