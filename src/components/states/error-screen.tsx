"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";

/**
 * What a person sees when a page crashes. It says plainly that nothing was lost, offers Try again (which re-fetches the page) and a
 * way out, and shows the error's reference (digest) so a support reply can find the exact failure in the server log. It never shows
 * the error message itself: that can contain details that are not for the browser.
 */
export function ErrorScreen({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // the browser console keeps the detail for whoever is debugging; a real reporter hooks in here
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-md py-16" role="alert">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description="We couldn’t show this page. Your account, bookings and payments are safe. Please try again, and if it keeps happening, tell us the reference below."
        action={
          <div className="mt-1 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => retry()}>Try again</Button>
              <ButtonLink href="/directory" variant="secondary">
                Go to the Directory
              </ButtonLink>
            </div>
            {error.digest && (
              <p className="text-small text-text-secondary">
                Reference: <span className="font-mono">{error.digest}</span>
              </p>
            )}
          </div>
        }
      />
    </div>
  );
}
