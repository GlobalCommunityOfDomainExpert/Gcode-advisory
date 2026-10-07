export type Engagement = "paid" | "free" | "community";

const ENGAGEMENT: Record<Engagement, [string, string]> = {
  paid: ["Paid sessions", "bg-primary-light text-primary"],
  free: ["Free sessions", "bg-success-light text-success"],
  community: ["Community member", "bg-bg-light text-text-secondary"],
};

/** How an expert participates: paid sessions, free sessions, or community member. */
export function EngagementPill({ type }: { type: Engagement }) {
  const [label, cls] = ENGAGEMENT[type];
  return (
    <span className={`${cls} text-small inline-flex items-center rounded-full px-2.5 py-0.5 font-medium`}>{label}</span>
  );
}
