import { AgendaSkeleton, LoadingFrame, PageHeaderSkeleton } from "@/components/states";

/** My bookings while the list loads: the agenda rows, so the page does not jump. */
export default function Loading() {
  return (
    <LoadingFrame label="Loading your bookings">
      <PageHeaderSkeleton actions />
      <AgendaSkeleton rows={3} />
    </LoadingFrame>
  );
}
