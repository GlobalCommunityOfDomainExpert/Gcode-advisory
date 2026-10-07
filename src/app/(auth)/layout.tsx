import { ReactNode } from "react";
import { AppShell, Navbar } from "@/components/layout";

/** The page behind the auth modal: logo-only navbar and footer, dimmed by the modal scrim. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell navbar={<Navbar guest />}>
      <div className="min-h-[45vh]" />
      {children}
    </AppShell>
  );
}
