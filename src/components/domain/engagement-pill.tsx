export type Engagement = "provider" | "community";

const ENGAGEMENT: Record<Engagement, [string, string]> = {
  provider: ["Service provider", "bg-primary-light text-primary"],
  community: ["Community member", "bg-bg-light text-text-secondary"],
};

/** How an expert participates: service provider (paid and/or free sessions) or community member. */
export function EngagementPill({ type }: { type: Engagement }) {
  const [label, cls] = ENGAGEMENT[type];
  return (
    <span className={`${cls} text-small inline-flex items-center rounded-full px-2.5 py-0.5 font-medium`}>{label}</span>
  );
}
