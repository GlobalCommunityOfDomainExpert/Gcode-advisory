import { LoadingFrame, ProfileSkeleton } from "@/components/states";

/** My profile while it loads: the intro card and the section cards. */
export default function Loading() {
  return (
    <LoadingFrame label="Loading your profile">
      <ProfileSkeleton />
    </LoadingFrame>
  );
}
