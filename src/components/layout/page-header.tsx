import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Icon, SectionLabel } from "@/components/atoms";

export interface PageHeaderProps {
  /** Small uppercase label above the title. */
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Photo / logo shown left of the title. */
  lead?: ReactNode;
  actions?: ReactNode;
  /** A `BackLink` that replaces the eyebrow on focused flows (booking, checkout). */
  back?: ReactNode;
  /** Rendered below the header row (search bars, privacy notes). */
  extra?: ReactNode;
  /** Top padding utility, default `pt-8`. */
  paddingTop?: string;
}

/**
 * The ONE header every signed-in page uses, so titles look the same everywhere:
 * eyebrow → title (display, extra-bold, navy) → one-line subtitle, actions on the right, one faint red glow.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  lead,
  actions,
  back,
  extra,
  paddingTop = "pt-8",
}: PageHeaderProps) {
  return (
    <div className={`relative ${paddingTop} pb-6`}>
      <span
        aria-hidden="true"
        className="bg-secondary/5 pointer-events-none absolute -top-10 right-0 -z-10 size-72 rounded-full blur-3xl"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-4">
          {lead}
          <div className="min-w-0">
            {back}
            {eyebrow && <SectionLabel>{eyebrow}</SectionLabel>}
            <h1
              className={`text-display text-primary ${eyebrow || back ? "mt-1" : ""} leading-tight font-extrabold tracking-tight`}
            >
              {title}
            </h1>
            {subtitle && <p className="text-body text-text-secondary mt-1 max-w-2xl">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
      {extra && <div className="relative mt-5">{extra}</div>}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="text-small text-text-secondary hover:text-text-primary focus-visible:ring-primary mb-1.5 inline-flex items-center gap-1 rounded-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Icon icon={ArrowLeft} size="sm" /> {children}
    </a>
  );
}
