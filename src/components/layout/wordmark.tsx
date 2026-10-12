import Image from "next/image";

export interface WordmarkProps {
  /** Navy lettering for light backgrounds (the footer); white lettering (default) for the navy navbar. */
  dark?: boolean;
  size?: "md" | "lg";
  href?: string;
}

/**
 * The GCODE logo. Two files, same artwork: /app-logo.png has white lettering for navy surfaces, /gcode-logo-dark.png has navy lettering
 * for light ones. The red ring is the same in both.
 */
export function Wordmark({ dark = false, size = "md", href = "/" }: WordmarkProps) {
  const lg = size === "lg";
  return (
    <a href={href} className="flex items-center" aria-label="GCODE — Power it up">
      <Image
        src={dark ? "/gcode-logo-dark.png" : "/app-logo.png"}
        alt=""
        width={1271}
        height={549}
        priority={!dark}
        className={`${lg ? "h-28" : "h-12"} w-auto`}
      />
    </a>
  );
}
