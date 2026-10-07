import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardPadding = "sm" | "md" | "lg";

const paddingClass: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}

/** White surface with a hairline border. */
export function Card({ padding = "sm", className, ...props }: CardProps) {
  return (
    <div
      className={cn("border-border-light bg-surface-light rounded-md border", paddingClass[padding], className)}
      {...props}
    />
  );
}
