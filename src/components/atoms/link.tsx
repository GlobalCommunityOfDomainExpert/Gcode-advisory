import { AnchorHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/lib/ui";

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

/** Inline text link. The underline appears on hover. For client-side navigation wrap `next/link` with the same classes. */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn("text-primary text-body font-medium underline-offset-2 hover:underline", focusRing, className)}
    {...props}
  />
));

Link.displayName = "Link";
