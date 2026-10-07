import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Pulsing placeholder. Size and round it with `className` so it mirrors the content it stands in for. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("bg-bg-light animate-pulse", className)} {...props} />;
}
