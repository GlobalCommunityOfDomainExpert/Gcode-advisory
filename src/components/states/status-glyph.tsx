/**
 * The big marks. Both are built from the logo's own shapes: the red ring with the bar of the "G". They sit on the page in the brand navy,
 * sized in em so one font-size on the wrapper scales the whole mark.
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
    <div role="img" aria-label="Error 404" className="text-primary flex items-center gap-[0.06em] text-[5.5rem] leading-none font-extrabold tracking-tight sm:text-[7.5rem]">
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
    <div role="img" aria-label="Error" className="text-primary text-[5.5rem] leading-none font-extrabold sm:text-[7rem]">
      <Ring>
        <span aria-hidden="true" className="text-[0.5em]">
          !
        </span>
      </Ring>
    </div>
  );
}
