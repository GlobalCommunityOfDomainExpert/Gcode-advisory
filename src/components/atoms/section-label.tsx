import { HTMLAttributes } from "react";

export type SectionLabelProps = HTMLAttributes<HTMLParagraphElement>;

export function SectionLabel({
  className = "",
  children,
  ...props
}: SectionLabelProps) {
  return (
    <p
      className={`text-small text-text-secondary font-bold tracking-widest uppercase ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}
