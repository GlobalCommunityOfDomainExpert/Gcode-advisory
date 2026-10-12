import { Skeleton } from "@/components/atoms";

/**
 * Loading shapes for the screens that wait on the backend. Each mirrors the real layout (same card, same rows) so nothing jumps
 * when the content arrives. They are server components with no state: a loading.tsx just composes them.
 */

/** The wrapper every loading screen uses: announces itself politely and hides the grey boxes from screen readers. */
export function LoadingFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Eyebrow, title and a one-line subtitle, in the space PageHeader takes. */
export function PageHeaderSkeleton({ actions = false }: { actions?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pt-8 pb-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-20 rounded-sm" />
        <Skeleton className="h-8 w-56 rounded-sm" />
        <Skeleton className="h-4 w-72 max-w-full rounded-sm" />
      </div>
      {actions && <Skeleton className="h-10 w-48 rounded-md" />}
    </div>
  );
}

/** A white card with a heading and a few lines of text. */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-surface-light border-border-light rounded-md border p-6 shadow-xs sm:p-7">
      <Skeleton className="h-5 w-40 rounded-sm" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={`h-4 rounded-sm ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

/** My bookings: the date column and a status-striped card, as many times as asked. */
export function AgendaSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="pb-8">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-5">
          <div className="flex flex-col items-center gap-1.5 pt-1">
            <Skeleton className="h-3 w-8 rounded-sm" />
            <Skeleton className="h-7 w-8 rounded-sm" />
            <Skeleton className="h-3 w-8 rounded-sm" />
          </div>
          <div className="bg-surface-light border-border-light mb-5 flex items-center gap-4 rounded-lg border p-5 shadow-sm">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <Skeleton className="h-5 w-3/5 rounded-sm" />
              <Skeleton className="h-4 w-2/5 rounded-sm" />
            </div>
            <Skeleton className="hidden h-9 w-28 rounded-sm sm:block" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The three figures at the top of the Payouts page. */
export function StatStripSkeleton() {
  return (
    <div className="bg-surface-light border-border-light grid divide-y rounded-md border shadow-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-3 p-6">
          <Skeleton className="h-4 w-32 rounded-sm" />
          <Skeleton className="h-9 w-24 rounded-sm" />
          <Skeleton className="h-3 w-40 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

/** A table: a header strip and rows of the same height. */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface-light border-border-light overflow-hidden rounded-md border shadow-xs">
      <Skeleton className="h-11 rounded-none" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="border-border-light flex items-center gap-4 border-t px-5 py-4">
          <Skeleton className="h-4 w-20 rounded-sm" />
          <Skeleton className="h-4 flex-1 rounded-sm" />
          <Skeleton className="h-4 w-16 rounded-sm" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** A profile: the tinted cover with the round photo, then a few section cards. */
export function ProfileSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="space-y-5 pt-6 pb-8">
      <div className="bg-surface-light border-border-light overflow-hidden rounded-md border shadow-xs">
        <Skeleton className="h-28 rounded-none" />
        <div className="space-y-3 p-6 pt-0">
          <Skeleton className="-mt-12 size-24 rounded-full ring-4 ring-white" />
          <Skeleton className="h-7 w-64 max-w-full rounded-sm" />
          <Skeleton className="h-4 w-48 rounded-sm" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-10 w-32 rounded-sm" />
            <Skeleton className="h-10 w-24 rounded-sm" />
          </div>
        </div>
      </div>
      {Array.from({ length: sections }, (_, i) => (
        <CardSkeleton key={i} lines={i === 0 ? 4 : 2} />
      ))}
    </div>
  );
}
