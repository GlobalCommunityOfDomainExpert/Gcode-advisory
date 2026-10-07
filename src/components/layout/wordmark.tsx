export interface WordmarkProps {
  /** Dark text for light backgrounds; white (default) for the navy navbar. */
  dark?: boolean;
  size?: "md" | "lg";
  href?: string;
}

/** Logo placeholder — swap for /app-logo.png (white) and /gcode-logo-black.png (dark) when the assets are final. */
export function Wordmark({ dark = false, size = "md", href = "/" }: WordmarkProps) {
  const lg = size === "lg";
  return (
    <a href={href} className="flex items-center gap-1.5" aria-label="GCODE — Power it up">
      <span
        className={`grid ${lg ? "text-heading size-14 border-4" : "text-large size-9 border-[3px]"} border-secondary place-items-center rounded-full font-extrabold ${
          dark ? "text-text-primary" : "text-white"
        }`}
      >
        G
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`${lg ? "text-heading" : "text-large"} font-extrabold tracking-tight ${
            dark ? "text-text-primary" : "text-white"
          }`}
        >
          CODE
        </span>
        <span
          className={`italic ${dark ? "text-text-secondary" : "text-white/70"}`}
          style={{ fontSize: ".5rem", letterSpacing: ".14em" }}
        >
          POWER IT UP
        </span>
      </span>
    </a>
  );
}
