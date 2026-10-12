"use client";

import { ErrorScreen } from "@/components/states";

/** A signed-in page crashed: the message shows in the content area, so the sidebar and top bar stay and the person can go elsewhere. */
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} />;
}
