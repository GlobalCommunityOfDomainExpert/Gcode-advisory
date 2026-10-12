import { ReactNode } from "react";
import Link from "next/link";

/**
 * The page shape for "something is not as expected" (not found, error). No card and no panel: the mark, the words and the actions sit
 * directly on the page, centred, so it reads as part of the site and not as a notice dropped on top of it.
 */
export function StatusPage({
  glyph,
  title,
  description,
  actions,
  children,
  links,
}: {
  glyph: ReactNode;
  title: string;
  description: string;
  actions: ReactNode;
  /** A small line under the actions (the error's reference). */
  children?: ReactNode;
  links?: { href: string; label: string }[];
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:py-24">
      <div>
        <div className="flex justify-center">{glyph}</div>
        <h1 className="text-display text-text-primary mt-8 font-extrabold tracking-tight">{title}</h1>
        <p className="text-body text-text-secondary mx-auto mt-3 max-w-md">{description}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">{actions}</div>
        {children}
        {links && links.length > 0 && (
          <nav aria-label="Other places" className="text-small text-text-secondary mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-primary font-semibold underline-offset-2 hover:underline">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
