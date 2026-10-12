"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/atoms";

/** Shares the page: the phone's share sheet where there is one, otherwise copies the link. */
export function ShareButton({ title, label = "Share", url: given }: { title: string; label?: string; /** Defaults to this page. */ url?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = given ?? window.location.href.split("#")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* cancelled, or the browser refused: nothing to undo */
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={share} aria-live="polite">
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
      {copied ? "Link copied" : label}
    </Button>
  );
}
