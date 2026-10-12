"use client";

import { useRef, useState } from "react";
import { CircleCheck } from "lucide-react";
import { Select, Switch } from "@/components/atoms";
import { Banner } from "@/components/molecules";
import { SettingGroup } from "@/components/domain";
import type { NotificationPrefs } from "@/lib/notifications/types";

/** Every half hour, "HH:MM" for the server and "10:30 pm" for people. */
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 ? "30" : "00";
  return { value: `${String(h).padStart(2, "0")}:${m}`, label: `${h % 12 || 12}:${m} ${h < 12 ? "am" : "pm"}` };
});
const labelFor = (v: string) => TIMES.find((t) => t.value === v)?.label ?? v;

/**
 * Three settings, saved the moment you change one (nothing to press): email on/off, in-app on/off, quiet hours.
 * The switch moves at once and goes back if the save fails.
 */
export function NotificationSettings({ initial, email }: { initial: NotificationPrefs; email: string }) {
  const [prefs, setPrefs] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function change(patch: Partial<NotificationPrefs>) {
    const before = prefs;
    const mine = ++latest.current;
    setPrefs({ ...prefs, ...patch });
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/notifications/prefs", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json().catch(() => null);
      if (mine !== latest.current) return; // a newer change is already on its way; let it have the last word
      if (!res.ok) throw new Error(json?.error ?? "Something went wrong. Please try again.");
      setPrefs(json as NotificationPrefs);
      setState("saved");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setState("idle"), 2000);
    } catch (e) {
      if (mine !== latest.current) return;
      setPrefs(before);
      setState("idle");
      setError(e instanceof Error && e.message ? e.message : "Network problem. Check your connection and try again.");
    }
  }

  const options = TIMES.some((t) => t.value === prefs.quietFrom) && TIMES.some((t) => t.value === prefs.quietTo)
    ? TIMES
    : [...TIMES, ...[prefs.quietFrom, prefs.quietTo].filter((v) => !TIMES.some((t) => t.value === v)).map((v) => ({ value: v, label: labelFor(v) }))];

  return (
    <div>
      <p role="status" aria-live="polite" className="text-small text-text-secondary -mt-2 mb-2 flex h-5 items-center justify-end gap-1.5">
        {state === "saving" && "Saving…"}
        {state === "saved" && (
          <span className="text-success flex items-center gap-1.5 font-medium">
            <CircleCheck className="size-4" aria-hidden="true" /> Saved
          </span>
        )}
      </p>
      {error && (
        <div className="mb-4">
          <Banner tone="danger" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        </div>
      )}

      <SettingGroup title="Email" description="Booking requests, answers, cancellations and reminders.">
        <Switch id="n-email" label="Email me" checked={prefs.emailOn} onChange={(e) => change({ emailOn: e.target.checked })} />
        <p className="text-small text-text-secondary">Sent to {email}.</p>
      </SettingGroup>

      <SettingGroup title="In-app" description="The bell at the top of every page.">
        <Switch id="n-inapp" label="Show in the bell" checked={prefs.inAppOn} onChange={(e) => change({ inAppOn: e.target.checked })} />
        {!prefs.inAppOn && <p className="text-small text-text-secondary">The bell stays empty. Turn this on to see your latest updates there.</p>}
      </SettingGroup>

      <SettingGroup title="Quiet hours" description="Hold back emails at night. Times are IST.">
        <Switch id="n-quiet" label="Pause emails during quiet hours" checked={prefs.quietOn} onChange={(e) => change({ quietOn: e.target.checked })} />
        {prefs.quietOn && (
          <div className="flex max-w-sm items-center gap-3">
            <Select aria-label="Quiet hours start" value={prefs.quietFrom} onChange={(e) => change({ quietFrom: e.target.value })}>
              {options.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <span className="text-small text-text-secondary">to</span>
            <Select aria-label="Quiet hours end" value={prefs.quietTo} onChange={(e) => change({ quietTo: e.target.value })}>
              {options.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        )}
        <p className="text-small text-text-secondary">
          Emails held back still appear in the bell. Reminders 10 minutes before a session are always sent.
        </p>
      </SettingGroup>
    </div>
  );
}
