"use client";

import { useEffect, useState } from "react";
import { Check, Copy, RotateCcw, ShieldCheck } from "lucide-react";
import { Button, ButtonLink, Icon } from "@/components/atoms";
import { StatusPage } from "./status-page";
import { ErrorGlyph } from "./status-glyph";

const STEPS = [
  "Try again. A short hiccup usually clears on its own.",
  "If it keeps happening, go back and open the page again.",
  "Still stuck? Reply to any GCODE email and quote the reference below.",
];

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
        reassurance="This one is on our side. Nothing you did caused it, and nothing was lost."
        eyebrow={
          <span className="bg-success-light text-success inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 tracking-normal normal-case">
            <Icon icon={ShieldCheck} size="sm" className="size-3.5!" /> Your data is safe
          </span>
        }
        title="Something went wrong"
        description="We couldn’t show this page. Your account, bookings and payments are all safe."
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
        footnote="Questions? Reply to any GCODE email and we’ll help."
      >
        <div className="space-y-2">
          <p className="text-small text-text-secondary font-bold tracking-widest uppercase">What you can do</p>
          <ol className="space-y-2">
            {STEPS.map((s, i) => (
              <li key={s} className="text-small text-text-secondary flex items-start gap-3">
                <span className="bg-primary-light text-primary grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold">{i + 1}</span>
                <span className="pt-px">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        {error.digest && (
          <div className="border-border-light bg-bg-subtle flex items-center justify-between gap-3 rounded-md border px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-small text-text-secondary">Reference</p>
              <p className="text-body text-text-primary truncate font-mono font-semibold">{error.digest}</p>
            </div>
            <Button variant="outline" size="sm" onClick={copy} aria-live="polite">
              <Icon icon={copied ? Check : Copy} size="sm" /> {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}
      </StatusPage>
    </div>
  );
}
