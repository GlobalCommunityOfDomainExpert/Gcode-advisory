import { ReactNode } from "react";
import Link from "next/link";

/**
 * The page shape for "something is not as expected" (not found, error). No card and no panel: a quiet grey mark, a short heading, one
 * sentence and the actions sit directly on the page, centred. It is compact on purpose, so the page and the footer fit in a normal window
 * without scrolling, and it is not loud: people are not meant to see it often.
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
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-8 text-center sm:py-12">
      <div className="flex justify-center">{glyph}</div>
      <h1 className="text-heading text-text-primary/85 mt-5 font-semibold">{title}</h1>
      <p className="text-body text-text-secondary mx-auto mt-2 max-w-md">{description}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      {children}
      {links && links.length > 0 && (
        <nav aria-label="Other places" className="text-small text-text-secondary mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="underline-offset-2 hover:underline hover:text-text-primary">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
