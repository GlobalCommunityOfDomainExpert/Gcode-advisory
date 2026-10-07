export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

/** Red bar + tracked uppercase title + muted subtitle. */
export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-secondary h-10 w-1 rounded-full" />
      <div>
        <h2 className="text-text-secondary text-base font-bold tracking-widest uppercase">{title}</h2>
        {subtitle && <p className="text-small text-text-secondary/70">{subtitle}</p>}
      </div>
    </div>
  );
}
