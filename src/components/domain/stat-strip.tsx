export interface Stat {
  label: string;
  value: string;
  trend?: string;
  sub?: string;
}

export interface StatStripProps {
  stats: Stat[];
}

/** Dashboard figures: plain numbers in ONE card, divided by hairlines. No icons, no charts. */
export function StatStrip({ stats }: StatStripProps) {
  return (
    <dl className="bg-surface-light divide-border-light ring-primary/10 grid divide-y rounded-lg shadow-sm ring-1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map((s) => (
        <div key={s.label} className="px-6 py-5">
          <dt className="text-small text-text-secondary font-medium">{s.label}</dt>
          <dd className="text-heading text-text-primary mt-1 leading-none font-extrabold tracking-tight tabular-nums">
            {s.value}
            {s.trend && <span className="text-small text-success ml-2 font-semibold tracking-normal">{s.trend}</span>}
          </dd>
          <dd className="text-small text-text-secondary mt-1.5">{s.sub ?? ""}</dd>
        </div>
      ))}
    </dl>
  );
}
