/**
 * The marks for the pages people are not meant to see often (not found, error). Deliberately quiet: grey, not the brand navy and red,
 * and no bolder than the surrounding page. Built from the logo's shapes: a ring with the bar of the "G". Sized in em, so one font-size on
 * the wrapper scales the whole mark.
 */

function Ring({ children }: { children?: React.ReactNode }) {
  return (
    <span aria-hidden="true" className="border-text-secondary/25 relative inline-grid size-[0.8em] place-items-center rounded-full border-[0.12em] align-middle">
      {children}
    </span>
  );
}

/** "4◯4": the zero is the logo's ring with its bar. */
export function NotFoundGlyph() {
  return (
    <div role="img" aria-label="Error 404" className="text-text-secondary/40 flex items-center gap-[0.06em] text-[4rem] leading-none font-semibold tracking-tight sm:text-[5rem]">
      <span aria-hidden="true">4</span>
      <Ring>
        <span className="bg-text-secondary/25 absolute top-1/2 left-1/2 h-[0.13em] w-[0.38em] -translate-y-1/2 rounded-full" />
      </Ring>
      <span aria-hidden="true">4</span>
    </div>
  );
}

/** A ring with an exclamation mark: something on our side went wrong. */
export function ErrorGlyph() {
  return (
    <div role="img" aria-label="Error" className="text-text-secondary/40 text-[4rem] leading-none font-semibold sm:text-[5rem]">
      <Ring>
        <span aria-hidden="true" className="text-[0.5em]">
          !
        </span>
      </Ring>
    </div>
  );
}
