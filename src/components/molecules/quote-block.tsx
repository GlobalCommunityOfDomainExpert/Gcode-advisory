import { ReactNode } from "react";

export interface QuoteBlockProps {
  children: ReactNode;
  /** `lg` is the wireframe size used for the elevator pitch. */
  size?: "md" | "lg";
}

export function QuoteBlock({ children, size = "lg" }: QuoteBlockProps) {
  return (
    <p
      className={`text-text-primary border-primary border-l-4 italic ${
        size === "lg" ? "text-large pl-5 leading-relaxed" : "text-body pl-4"
      }`}
    >
      {children}
    </p>
  );
}
