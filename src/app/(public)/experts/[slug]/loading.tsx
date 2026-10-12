import { LoadingFrame, ProfileSkeleton } from "@/components/states";

/** A public expert page while it loads. */
export default function Loading() {
  return (
    <LoadingFrame label="Loading this profile">
      <ProfileSkeleton />
    </LoadingFrame>
  );
}
