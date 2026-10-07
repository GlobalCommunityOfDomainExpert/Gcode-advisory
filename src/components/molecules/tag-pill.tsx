/** Read-only tag (domains, skills, days). The editable `Chip` is for selecting; this is for showing. */
export function TagPill({ children }: { children: string }) {
  return (
    <span className="bg-primary-light text-primary text-small inline-flex items-center rounded-full px-3 py-1 font-medium">
      {children}
    </span>
  );
}

export function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <TagPill key={item}>{item}</TagPill>
      ))}
    </div>
  );
}
