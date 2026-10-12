import { CardSkeleton, LoadingFrame, PageHeaderSkeleton } from "@/components/states";

/** A receipt while it loads. */
export default function Loading() {
  return (
    <LoadingFrame label="Loading the receipt">
      <PageHeaderSkeleton />
      <div className="max-w-2xl pb-8">
        <CardSkeleton lines={6} />
      </div>
    </LoadingFrame>
  );
}
