import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Hairline separator. */
export function Divider({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr role="separator" className={cn("border-border-light w-full border-0 border-t", className)} {...props} />;
}
