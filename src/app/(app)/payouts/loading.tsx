import { LoadingFrame, PageHeaderSkeleton, StatStripSkeleton, TableSkeleton } from "@/components/states";

/** Payouts while the figures load: the three-figure strip and the table. */
export default function Loading() {
  return (
    <LoadingFrame label="Loading your earnings">
      <PageHeaderSkeleton />
      <div className="space-y-5 pb-8">
        <StatStripSkeleton />
        <TableSkeleton />
      </div>
    </LoadingFrame>
  );
}
