import { ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem } from "@/components/molecules/breadcrumb";

export interface PageHeroProps {
  crumbs?: BreadcrumbItem[];
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  /** Bottom padding utility; the next card overlaps the band with a negative margin. Default `pb-20`. */
  paddingBottom?: string;
  /** Break out of the page container to the full viewport width (default). Turn off to render inline. */
  bleed?: boolean;
}

/** Full-bleed navy band at the top of authenticated pages; the next card overlaps it. */
export function PageHero({
  crumbs,
  title,
  subtitle,
  actions,
  paddingBottom = "pb-20",
  bleed = true,
}: PageHeroProps) {
  return (
    <div
      className={`from-primary to-primary-hover relative overflow-hidden bg-linear-to-br ${
        bleed ? "left-1/2 w-screen -translate-x-1/2" : "w-full"
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/50 via-black/20 to-transparent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full border border-white/10"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 right-24 size-40 rounded-full border border-white/10"
      />
      <span
        aria-hidden="true"
        className="bg-secondary/20 pointer-events-none absolute -bottom-20 left-1/3 size-56 rounded-full blur-3xl"
      />
      <div className={`relative mx-auto max-w-7xl space-y-3 px-4 pt-7 ${paddingBottom} sm:px-6 lg:px-8`}>
        {crumbs && <Breadcrumb items={crumbs} dark />}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-display font-bold text-white">{title}</h1>
            {subtitle && <p className="text-body mt-1 text-white/70">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
