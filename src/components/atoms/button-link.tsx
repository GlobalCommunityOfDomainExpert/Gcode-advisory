import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes, forwardRef } from "react";
import { ButtonSize, ButtonVariant, buttonClasses } from "./button";

export interface ButtonLinkProps
  extends
    LinkProps,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    { variant = "primary", size = "md", className = "", children, ...props },
    ref,
  ) => {
    return (
      <Link
        ref={ref}
        className={buttonClasses(variant, size, className)}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

ButtonLink.displayName = "ButtonLink";
