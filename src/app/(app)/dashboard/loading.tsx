import { CardSkeleton, LoadingFrame, PageHeaderSkeleton } from "@/components/states";

/** The dashboard's shape while it loads: header, the focus card, the three numbers, the list and the next step. */
export default function Loading() {
  return (
    <LoadingFrame label="Loading your dashboard">
      <PageHeaderSkeleton />
      <div className="grid gap-5 pb-8 lg:grid-cols-12">
        <div className="lg:col-span-12">
          <CardSkeleton lines={2} />
        </div>
        <div className="lg:col-span-12">
          <CardSkeleton lines={1} />
        </div>
        <div className="lg:col-span-8">
          <CardSkeleton lines={4} />
        </div>
        <div className="lg:col-span-4">
          <CardSkeleton lines={3} />
        </div>
      </div>
    </LoadingFrame>
  );
}
