import Image from "next/image";

export interface WordmarkProps {
  /** Dark text for light backgrounds; white (default) for the navy navbar. */
  dark?: boolean;
  size?: "md" | "lg";
  href?: string;
}

/**
 * The GCODE logo. The light-on-dark version is /app-logo.png (white lettering, red G, transparent background).
 * There is no dark-on-light file yet, so `dark` keeps the text wordmark; swap it for /gcode-logo-black.png when that asset exists.
 */
export function Wordmark({ dark = false, size = "md", href = "/" }: WordmarkProps) {
  const lg = size === "lg";
  if (!dark) {
    return (
      <a href={href} className="flex items-center" aria-label="GCODE — Power it up">
        <Image
          src="/app-logo.png"
          alt=""
          width={1271}
          height={549}
          priority
          className={`${lg ? "h-28" : "h-12"} w-auto`}
        />
      </a>
    );
  }
  return (
    <a href={href} className="flex items-center gap-1.5" aria-label="GCODE — Power it up">
      <span
        className={`grid ${lg ? "text-heading size-14 border-4" : "text-large size-9 border-[3px]"} border-secondary text-text-primary place-items-center rounded-full font-extrabold`}
      >
        G
      </span>
      <span className="flex flex-col leading-none">
        <span className={`${lg ? "text-heading" : "text-large"} text-text-primary font-extrabold tracking-tight`}>CODE</span>
        <span className="text-text-secondary italic" style={{ fontSize: ".5rem", letterSpacing: ".14em" }}>
          POWER IT UP
        </span>
      </span>
    </a>
  );
}
