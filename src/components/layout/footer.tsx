import Link from "next/link";
import { Wordmark } from "./wordmark";

interface FooterLink {
  label: string;
  href: string;
}

function FooterLinkGroup({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <p className="text-small text-text-secondary mb-2 font-semibold tracking-wide uppercase">{title}</p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-small text-text-secondary hover:text-text-primary">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer({ className = "mt-20" }: { className?: string }) {
  return (
    <footer className={`border-border-light bg-surface-light border-t ${className}`}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xs space-y-3">
            <Wordmark dark />
            <p className="text-small text-text-secondary">
              Connecting the GCODE community through mentoring and shared problem-solving.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 sm:gap-16">
            <FooterLinkGroup
              title="Company"
              links={[
                { label: "About Us", href: "#" },
                { label: "Contact Us", href: "#" },
              ]}
            />
            <FooterLinkGroup
              title="Legal"
              links={[
                { label: "Terms & Conditions", href: "#" },
                { label: "Refund Policy", href: "#" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="border-border-light border-t px-4 py-4 sm:px-6 lg:px-8">
        <p className="text-small text-text-secondary text-center">
          © {new Date().getFullYear()} GCODE. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
