import { ReactNode } from "react";
import { Checkbox } from "@/components/atoms";
import { EmptyState } from "./empty-state";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onToggleRow?: (key: string) => void;
  onToggleAll?: (checked: boolean) => void;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  selectable = false,
  selectedKeys,
  onToggleRow,
  onToggleAll,
  onRowClick,
  emptyState,
}: TableProps<T>) {
  if (rows.length === 0) {
    return emptyState ?? <EmptyState title="Nothing here yet" />;
  }

  const allSelected =
    selectable && rows.every((row) => selectedKeys?.has(rowKey(row)));
  const someSelected =
    selectable &&
    !allSelected &&
    rows.some((row) => selectedKeys?.has(rowKey(row)));

  return (
    <div className="border-border-light bg-surface-light overflow-x-auto rounded-md border">
      <table className="text-small w-full text-left">
        <thead>
          <tr className="border-border-light border-b">
            {selectable && (
              <th className="w-10 px-3 py-3">
                <Checkbox
                  aria-label="Select all rows"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={(event) => onToggleAll?.(event.target.checked)}
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`text-text-secondary text-small px-3 py-3 font-medium tracking-wide uppercase ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                className={`border-border-light hover:bg-bg-light border-b last:border-0 ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {selectable && (
                  <td
                    className="px-3 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      aria-label="Select row"
                      checked={selectedKeys?.has(key) ?? false}
                      onChange={() => onToggleRow?.(key)}
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-3 ${column.className ?? ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
