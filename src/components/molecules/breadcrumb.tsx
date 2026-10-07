import { Fragment } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Light text for use on the navy hero band. */
  dark?: boolean;
}

export function Breadcrumb({ items, dark = false }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="text-small flex min-w-0 items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={item.label}>
              <li className={isLast ? "min-w-0 flex-1 truncate" : "shrink-0"}>
                {item.href && !isLast ? (
                  <a
                    href={item.href}
                    className={`focus-visible:ring-primary text-small font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                      dark ? "text-white/70 hover:text-white" : "text-text-secondary"
                    }`}
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={`${dark ? "text-white" : "text-text-primary"} block truncate font-medium`}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className={`${dark ? "text-white/50" : "text-text-secondary"} shrink-0`}>
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
