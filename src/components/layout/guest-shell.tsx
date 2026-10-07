"use client";

import { ReactNode } from "react";
import { AppShell } from "./app-shell";
import { Navbar, NavLink } from "./navbar";

export interface GuestShellProps {
  children: ReactNode;
  links?: NavLink[];
  /** Float the navbar over a hero and turn it solid on scroll. */
  transparent?: boolean;
  onSignIn?: () => void;
  onRegister?: () => void;
}

/**
 * Signed-out pages (home, directory preview, public profiles): navbar with Sign in / Register, no sidebar.
 * Pair with `AuthedShell` for signed-in pages.
 */
export function GuestShell({ children, links = [], transparent = false, onSignIn, onRegister }: GuestShellProps) {
  return (
    <AppShell
      navbar={
        <Navbar
          links={links}
          transparent={transparent}
          onSecondaryCtaClick={onSignIn}
          onCtaClick={onRegister}
        />
      }
    >
      {children}
    </AppShell>
  );
}
