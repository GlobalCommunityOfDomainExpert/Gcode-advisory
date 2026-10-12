"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";

/** Publish or take down the profile from the profile view, the same calls the editor makes. Refuses below 100% (the server checks). */
export function PublishControl({ published, complete }: { published: boolean; complete: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(publish: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/publish", {
        method: publish ? "POST" : "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(j?.error ?? "Something went wrong. Please try again.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network problem. Check your connection and try again.");
    }
    setBusy(false);
  }

  if (!published && !complete) return null;
  return (
    <div>
      <Button size="sm" variant={published ? "outline" : "primary"} loading={busy} className="w-full" onClick={() => run(!published)}>
        {published ? "Unpublish" : "Publish profile"}
      </Button>
      {error && (
        <p className="text-small text-danger mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
