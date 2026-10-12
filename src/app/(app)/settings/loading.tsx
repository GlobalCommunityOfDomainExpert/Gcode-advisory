import { CardSkeleton, LoadingFrame } from "@/components/states";
import { Skeleton } from "@/components/atoms";

/** Account settings while it loads: the header, the section menu and a card. */
export default function Loading() {
  return (
    <LoadingFrame label="Loading your settings">
      <div className="flex items-center gap-4 pt-8 pb-6">
        <Skeleton className="size-20 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-3 w-24 rounded-sm" />
          <Skeleton className="h-8 w-56 rounded-sm" />
          <Skeleton className="h-4 w-64 max-w-full rounded-sm" />
        </div>
      </div>
      <div className="grid gap-8 pb-8 md:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-32 rounded-sm" />
          ))}
        </div>
        <div className="space-y-5">
          <CardSkeleton lines={4} />
          <CardSkeleton />
        </div>
      </div>
    </LoadingFrame>
  );
}
