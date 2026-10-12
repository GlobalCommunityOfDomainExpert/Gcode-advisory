/**
 * The big marks on the navy panel. Both are built from the logo's own shapes: the red ring with the bar of the "G".
 * Sized in em, so the one font-size on the wrapper scales the whole glyph.
 */

function Ring({ children }: { children?: React.ReactNode }) {
  return (
    <span aria-hidden="true" className="border-secondary relative inline-grid size-[0.8em] place-items-center rounded-full border-[0.14em] align-middle">
      {children}
    </span>
  );
}

/** "4◯4": the zero is the logo's ring with its bar. */
export function NotFoundGlyph() {
  return (
    <div role="img" aria-label="Error 404" className="flex items-center gap-[0.06em] text-[5.5rem] leading-none font-extrabold tracking-tight text-white sm:text-[7.5rem]">
      <span aria-hidden="true">4</span>
      <Ring>
        <span className="bg-secondary absolute top-1/2 left-1/2 h-[0.15em] w-[0.4em] -translate-y-1/2 rounded-full" />
      </Ring>
      <span aria-hidden="true">4</span>
    </div>
  );
}

/** A ring with an exclamation mark: something on our side went wrong. */
export function ErrorGlyph() {
  return (
    <div role="img" aria-label="Error" className="text-[6rem] leading-none font-extrabold text-white sm:text-[8rem]">
      <Ring>
        <span aria-hidden="true" className="text-[0.5em]">
          !
        </span>
      </Ring>
    </div>
  );
}
