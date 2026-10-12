"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms";
import { Banner, Modal } from "@/components/molecules";
import { SettingGroup, ValueLine } from "@/components/domain";

/**
 * Pause the account, and bring it back. Nothing is deleted: the profile is hidden, nobody can book it, and sessions that are
 * already booked carry on. Coming back needs one click here, then Publish on the profile.
 */
export function DangerZone({ deactivated: initial }: { deactivated: boolean }) {
  const router = useRouter();
  const [deactivated, setDeactivated] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(method: "POST" | "DELETE") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/deactivate", { method, credentials: "same-origin" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "Something went wrong. Please try again.");
      setDeactivated(json.deactivated === true);
      setConfirm(false);
      router.refresh(); // the profile pages read the new state
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Network problem. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4">
          <Banner tone="danger" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        </div>
      )}

      <SettingGroup title="Deactivate account" description="A pause, not a goodbye.">
        {deactivated ? (
          <div className="space-y-4">
            <Banner tone="warning">
              <b>Your account is deactivated.</b> Your profile is hidden and nobody can book you. Sessions already booked still go ahead.
            </Banner>
            <ValueLine
              text="Reactivate your account"
              sub="Your profile stays hidden until you publish it again from Profile."
              action={
                <Button type="button" size="sm" loading={busy} onClick={() => send("DELETE")}>
                  Reactivate
                </Button>
              }
            />
          </div>
        ) : (
          <ValueLine
            text="Hide your profile and pause new bookings"
            sub="Sessions already booked stay as they are. You can reactivate any time from this page."
            action={
              <Button type="button" variant="danger" size="sm" onClick={() => setConfirm(true)}>
                Deactivate
              </Button>
            }
          />
        )}
      </SettingGroup>

      <Modal
        open={confirm}
        onClose={() => !busy && setConfirm(false)}
        title="Deactivate your account?"
        footer={
          <>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirm(false)}>
              Keep it active
            </Button>
            <Button variant="danger" size="sm" loading={busy} onClick={() => send("POST")}>
              Deactivate
            </Button>
          </>
        }
      >
        <ul className="text-body text-text-secondary list-disc space-y-2 pl-5">
          <li>Your profile disappears from the directory and your public page stops working.</li>
          <li>Nobody can book you or send you new requests.</li>
          <li>Sessions already booked still go ahead, so check My bookings first.</li>
          <li>You can come back any time: reactivate here, then publish your profile again.</li>
        </ul>
      </Modal>
    </div>
  );
}
