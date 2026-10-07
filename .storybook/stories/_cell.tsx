import type { ReactNode } from "react";

/* Story helpers that reproduce the wireframe components page chrome (wireframe/src/screens/components/components-page.js):
 * a "stage" with the preview, and a caption with a coloured dot for the kind of state. */

export const CELL_KINDS = {
  default: ["Default", "bg-text-secondary/50"],
  interactive: ["Hover / focus", "bg-primary"],
  selected: ["Selected / on", "bg-success"],
  disabled: ["Disabled", "bg-border-hover"],
  error: ["Error", "bg-danger"],
  empty: ["Empty / loading", "bg-warning"],
  variant: ["Variants & sizes", "bg-primary/40"],
} as const;

export type CellKind = keyof typeof CELL_KINDS;

export interface CellProps {
  label: string;
  kind?: CellKind;
  note?: string;
  /** full row */
  wide?: boolean;
  /** two columns */
  w2?: boolean;
  /** block stage instead of flex */
  fill?: boolean;
  /** navy stage */
  dark?: boolean;
  /** page-grey stage */
  tint?: boolean;
  /** no padding, clipped */
  frame?: boolean;
  children: ReactNode;
}

export function Cell({ label, kind = "default", note, wide, w2, fill, dark, tint, frame, children }: CellProps) {
  const [kindLabel, dot] = CELL_KINDS[kind];
  const span = wide ? "md:col-span-2 xl:col-span-3" : w2 ? "xl:col-span-2" : "";
  const stage = frame
    ? "overflow-hidden rounded-md"
    : `border-border-light rounded-md border p-4 ${dark ? "bg-primary" : tint ? "bg-page" : "bg-surface-light"} ${fill ? "" : "flex flex-wrap items-center gap-3"}`;
  return (
    <figure data-cell data-kind={kind} className={`min-w-0 ${span}`}>
      <div className={stage}>{children}</div>
      <figcaption className="text-small mt-2 flex items-start gap-2">
        <span aria-hidden="true" className={`${dot} mt-1.5 size-2 shrink-0 rounded-full`} />
        <span className="min-w-0">
          <span className="text-text-primary font-medium">{label}</span>
          <span className="text-text-secondary">
            {" · "}
            {kindLabel}
            {note ? ` · ${note}` : ""}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export function CellGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-5 gap-y-6 p-6 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

/* Wireframe cgMatrix: rows × columns table. */
export function Matrix({
  first = "",
  cols,
  rows,
  cell,
}: {
  first?: string;
  cols: string[];
  rows: string[];
  cell: (row: string, col: string) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="text-small w-full min-w-max border-collapse">
        <thead>
          <tr>
            <th className="text-text-secondary py-2 pr-6 text-left font-medium">{first}</th>
            {cols.map((c) => (
              <th key={c} className="text-text-secondary py-2 pr-6 text-left font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r} className="border-border-light border-t">
              <th scope="row" className="text-text-primary py-3 pr-6 text-left font-mono font-medium">
                {r}
              </th>
              {cols.map((c) => (
                <td key={c} className="py-3 pr-6">
                  {cell(r, c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Wireframe cgFrame: a clipped page-grey box; fixed-position children stay inside it. */
export function Frame({ h, className = "", children }: { h: string; className?: string; children: ReactNode }) {
  return (
    <div className={`border-border-light bg-page relative overflow-hidden rounded-md border [transform:translateZ(0)] ${h} ${className}`}>
      {children}
    </div>
  );
}
