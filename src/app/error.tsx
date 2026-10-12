"use client";

import { ErrorScreen } from "@/components/states";

/**
 * A page outside the app frame crashed (sign-in, sign-up, the call room, public pages). The frame is not available here, so the
 * message stands on its own, centred. Inside the app, (app)/error.tsx keeps the sidebar.
 */
export default function RootError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="bg-bg-light flex min-h-screen items-center justify-center px-4">
      <ErrorScreen error={error} retry={retry} />
    </main>
  );
}
