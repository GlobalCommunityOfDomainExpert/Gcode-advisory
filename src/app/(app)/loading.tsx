import { CardSkeleton, LoadingFrame, PageHeaderSkeleton } from "@/components/states";

/** The fallback for any signed-in page that has no loading screen of its own: a header and two cards. */
export default function Loading() {
  return (
    <LoadingFrame label="Loading">
      <PageHeaderSkeleton />
      <div className="space-y-5 pb-8">
        <CardSkeleton lines={4} />
        <CardSkeleton />
      </div>
    </LoadingFrame>
  );
}
