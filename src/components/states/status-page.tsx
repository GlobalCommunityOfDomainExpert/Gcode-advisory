import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, LucideIcon } from "lucide-react";
import { Icon } from "@/components/atoms";
import { Wordmark } from "@/components/layout/wordmark";
import { IconTile } from "@/components/molecules/icon-tile";

/**
 * The page shape for "something is not as expected" (not found, error): a split card like the sign-in panel. On the left the navy
 * brand panel (logo, the big status glyph, a line of reassurance); on the right the words, the actions and where to go next.
 * Stacks on a phone: the panel becomes a short band above the text.
 */
export function StatusPage({
  glyph,
  reassurance,
  eyebrow,
  title,
  description,
  actions,
  children,
  footnote,
}: {
  glyph: ReactNode;
  /** The short line at the foot of the navy panel. */
  reassurance: ReactNode;
  eyebrow: ReactNode;
  title: string;
  description: string;
  actions: ReactNode;
  /** Under the actions: a search box, a list of next steps. */
  children?: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-14">
      <div className="border-border-light bg-surface-light overflow-hidden rounded-lg border shadow-lg md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="from-primary to-primary-hover relative flex min-h-56 flex-col justify-between overflow-hidden bg-linear-to-br p-7 text-white sm:p-9 md:min-h-[30rem]">
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/40 via-black/10 to-transparent" />
          <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full border border-white/10" />
          <span aria-hidden="true" className="pointer-events-none absolute top-10 -right-6 size-40 rounded-full border border-white/10" />
          <span aria-hidden="true" className="bg-secondary/25 pointer-events-none absolute -bottom-24 -left-10 size-64 rounded-full blur-3xl" />
          <div className="relative">
            <Wordmark />
          </div>
          <div className="relative py-6 md:py-0">{glyph}</div>
          <p className="text-small relative max-w-xs text-white/75">{reassurance}</p>
        </div>

        <div className="flex flex-col gap-6 p-7 sm:p-10">
          <div className="space-y-3">
            <p className="text-small text-text-secondary font-bold tracking-widest uppercase">{eyebrow}</p>
            <h1 className="text-display text-text-primary font-extrabold tracking-tight">{title}</h1>
            <p className="text-body text-text-secondary max-w-md">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
          {children}
        </div>
      </div>
      {footnote && <p className="text-small text-text-secondary mt-5 text-center">{footnote}</p>}
    </div>
  );
}

export interface NextStep {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
}

/** "Where to next": each way forward as a row with an icon tile, a label, a hint and a chevron. */
export function NextSteps({ title = "Try one of these", items }: { title?: string; items: NextStep[] }) {
  return (
    <div className="space-y-2">
      <p className="text-small text-text-secondary font-bold tracking-widest uppercase">{title}</p>
      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="border-border-light hover:border-primary/30 hover:bg-bg-subtle focus-visible:ring-primary group flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <IconTile icon={s.icon} />
              <span className="min-w-0 flex-1">
                <span className="text-body text-text-primary block font-semibold">{s.label}</span>
                <span className="text-small text-text-secondary block truncate">{s.hint}</span>
              </span>
              <Icon icon={ChevronRight} size="sm" className="text-text-secondary transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
