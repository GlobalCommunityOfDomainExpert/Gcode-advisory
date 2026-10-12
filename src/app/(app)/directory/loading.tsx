import { PageHeader } from "@/components/layout";
import { Skeleton } from "@/components/atoms";

/** Shown while the directory loads: cards in the same shape as the real ones, so nothing jumps. */
export default function Loading() {
  return (
    <>
      <PageHeader eyebrow="Directory" title="Find an expert" subtitle="Book a one-to-one session with a domain expert." />
      <div className="grid gap-6 pb-8 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading experts">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-surface-light border-border-light overflow-hidden rounded-md border shadow-sm">
            <Skeleton className="h-44" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-5 w-2/3 rounded-sm" />
              <Skeleton className="h-4 w-1/2 rounded-sm" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full rounded-sm" />
              <div className="flex items-center justify-between pt-3">
                <Skeleton className="h-6 w-24 rounded-sm" />
                <Skeleton className="h-11 w-24 rounded-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
