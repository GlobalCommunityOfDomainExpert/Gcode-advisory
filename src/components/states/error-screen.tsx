"use client";

import { useEffect, useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import { Button, ButtonLink, Icon } from "@/components/atoms";
import { StatusPage } from "./status-page";
import { ErrorGlyph } from "./status-glyph";

/**
 * What a person sees when a page crashes. It says plainly that nothing was lost, offers Try again (which re-fetches the page) and a way
 * out, and shows the error's reference (digest) with a copy button so a support reply can find the exact failure in the server log. It
 * never shows the error message itself: that can contain details that are not for the browser.
 */
export function ErrorScreen({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // the browser console keeps the detail for whoever is debugging; a real reporter hooks in here
    console.error(error);
  }, [error]);

  async function copy() {
    if (!error.digest) return;
    try {
      await navigator.clipboard.writeText(error.digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard not available: the reference is on screen to read out */
    }
  }

  return (
    <div role="alert">
      <StatusPage
        glyph={<ErrorGlyph />}
        title="Something went wrong"
        description="We couldn’t show this page. Your account, bookings and payments are safe."
        actions={
          <>
            <Button onClick={() => retry()}>
              <Icon icon={RotateCcw} size="sm" /> Try again
            </Button>
            <ButtonLink href="/directory" variant="secondary">
              Go to the Directory
            </ButtonLink>
          </>
        }
      >
        {error.digest && (
          <p className="text-small text-text-secondary mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            If it keeps happening, reply to any GCODE email with this reference: <span className="text-text-primary font-mono font-semibold">{error.digest}</span>
            <button
              type="button"
              onClick={copy}
              aria-live="polite"
              className="text-primary inline-flex items-center gap-1 rounded-sm font-semibold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              <Icon icon={copied ? Check : Copy} size="sm" className="size-3.5!" /> {copied ? "Copied" : "Copy"}
            </button>
          </p>
        )}
      </StatusPage>
    </div>
  );
}
