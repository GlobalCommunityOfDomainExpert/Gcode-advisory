import { LoadingFrame, PageHeaderSkeleton } from "@/components/states";
import { Skeleton } from "@/components/atoms";

/** The booking flow while the expert loads: the steps, the service choices, and the calendar beside the times. */
export default function Loading() {
  return (
    <LoadingFrame label="Loading the booking page">
      <PageHeaderSkeleton />
      <div className="space-y-6 pb-8">
        <Skeleton className="h-10 w-full max-w-xl rounded-md" />
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
          <Skeleton className="h-72 rounded-md" />
          <div className="grid grid-cols-2 content-start gap-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-11 rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    </LoadingFrame>
  );
}
