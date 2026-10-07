import { ChevronLeft, ChevronRight } from "lucide-react";
import { Icon } from "@/components/atoms";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = getPageNumbers(page, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="text-text-secondary hover:bg-bg-light focus-visible:ring-primary flex size-9 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Icon icon={ChevronLeft} size="sm" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
          className={`text-small focus-visible:ring-primary flex size-9 items-center justify-center rounded-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
            p === page
              ? "bg-primary text-white"
              : "text-text-primary hover:bg-bg-light"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="text-text-secondary hover:bg-bg-light focus-visible:ring-primary flex size-9 items-center justify-center rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Icon icon={ChevronRight} size="sm" />
      </button>
    </nav>
  );
}
