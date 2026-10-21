import type { ExpertCard, RescueExpert, RescueOptions } from "./types";

/** A directory card for an expert offered in the rescue flow. Only what the rescue options carry; the rest stays empty. */
export function rescueExpertCard(e: RescueExpert): ExpertCard {
  return {
    userId: e.expertId,
    slug: e.slug ?? "",
    name: e.name,
    photoUrl: e.photoUrl ?? null,
    headline: e.headline,
    location: e.location ?? null,
    bio: e.bio ?? null,
    bookable: true,
    engagement: "PROVIDER",
    status: "BOOKABLE",
    skills: e.skills ?? [],
    domains: e.domains ?? [],
    nextSlotAt: e.slots[0] ?? null,
    rating: e.ratingAvg !== null && e.ratingCount > 0 ? { average: e.ratingAvg, count: e.ratingCount } : undefined,
  };
}

export interface BestMatch {
  serviceId: number;
  startAt: string;
  who: string;
  /** True when it is the same expert as the original booking. */
  sameExpert: boolean;
}

/**
 * The one slot we would pick for the booker: the same expert's soonest new time if there is one, otherwise the soonest time of the
 * first other expert (the backend lists them closest expertise first).
 */
export function bestMatch(options: RescueOptions, expertName: string): BestMatch | null {
  if (options.sameExpert?.slots.length) {
    return { serviceId: options.sameExpert.serviceId, startAt: options.sameExpert.slots[0], who: expertName, sameExpert: true };
  }
  const e = options.others.find((o) => o.slots.length > 0);
  return e ? { serviceId: e.serviceId, startAt: e.slots[0], who: e.name, sameExpert: false } : null;
}
