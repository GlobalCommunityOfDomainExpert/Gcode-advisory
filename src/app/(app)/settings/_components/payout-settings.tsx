"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@/components/atoms";
import { Banner, FormField, ToggleGroup } from "@/components/molecules";
import { SettingGroup } from "@/components/domain";
import type { PayoutAccount } from "@/lib/booking/types";

/** The expert's payout account, inside Account settings. Details go to our payment partner once; we keep only a masked label. Earnings live on the Payouts page. */
export function PayoutAccountSettings({ account }: { account: PayoutAccount }) {
  const router = useRouter();
  const [method, setMethod] = useState<"UPI" | "BANK">(account.method ?? "UPI");
  const [holderName, setHolderName] = useState(account.holderName ?? "");
  const [upiId, setUpiId] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState(account.ifsc ?? "");
  const [editing, setEditing] = useState(!account.hasAccount);
  const [saved, setSaved] = useState(account);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payout/account", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(method === "UPI" ? { method, holderName, upiId } : { method, holderName, accountNo, ifsc }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "Something went wrong. Please try again.");
      setSaved(json as PayoutAccount);
      setAccountNo("");
      setUpiId("");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Network problem. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const where = saved.method === "UPI" ? saved.upiMasked : `Bank account ending ${saved.accountLast4}${saved.ifsc ? ` (${saved.ifsc})` : ""}`;

  return (
    <div id="payout-account" className="scroll-mt-6">
      {!account.paymentsEnabled && (
        <div className="mb-6">
          <Banner tone="info">Paid sessions are not switched on yet. You can add your payout details now so you are ready.</Banner>
        </div>
      )}
      {account.paymentsEnabled && !saved.hasAccount && (
        <div className="mb-6">
          <Banner tone="warning">
            People can book your paid sessions, but your earnings wait until you add a payout account.
          </Banner>
        </div>
      )}
      <SettingGroup title="Payout account" description="Where we send your earnings. Your full account details are held by our payment partner, not by GCODE.">
        {saved.hasAccount && !editing ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-body text-text-primary font-medium">{where}</p>
              <p className="text-small text-text-secondary">{saved.holderName}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Change
            </Button>
          </div>
        ) : (
          <form
            className="max-w-md space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <ToggleGroup
              ariaLabel="Payout method"
              value={method}
              onChange={(v) => setMethod(v === "BANK" ? "BANK" : "UPI")}
              options={[
                { value: "UPI", label: "UPI" },
                { value: "BANK", label: "Bank account" },
              ]}
            />
            <FormField label="Account holder name" htmlFor="po-name" required hint="As it appears at your bank.">
              <Input id="po-name" value={holderName} autoComplete="name" onChange={(e) => setHolderName(e.target.value)} />
            </FormField>
            {method === "UPI" ? (
              <FormField label="UPI id" htmlFor="po-upi" required hint="For example name@okbank.">
                <Input id="po-upi" value={upiId} autoComplete="off" autoCapitalize="none" onChange={(e) => setUpiId(e.target.value)} />
              </FormField>
            ) : (
              <>
                <FormField label="Account number" htmlFor="po-acc" required hint={saved.hasAccount && saved.method === "BANK" ? `Enter it again to change it. Now: ending ${saved.accountLast4}.` : undefined}>
                  <Input id="po-acc" inputMode="numeric" value={accountNo} autoComplete="off" onChange={(e) => setAccountNo(e.target.value)} />
                </FormField>
                <FormField label="IFSC code" htmlFor="po-ifsc" required hint="For example HDFC0001234.">
                  <Input id="po-ifsc" value={ifsc} autoComplete="off" autoCapitalize="characters" onChange={(e) => setIfsc(e.target.value.toUpperCase())} />
                </FormField>
              </>
            )}
            {error && <Banner tone="danger">{error}</Banner>}
            <div className="flex gap-3">
              <Button type="submit" loading={busy}>
                Save payout account
              </Button>
              {saved.hasAccount && (
                <Button type="button" variant="secondary" disabled={busy} onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
      </SettingGroup>


      <SettingGroup title="How payouts work" description="Paid sessions only.">
        <ul className="text-body text-text-secondary space-y-1">
          <li>Paid out every Monday, once at least ₹100 is available.</li>
          <li>GCODE keeps 15% of each paid session.</li>
          <li>Released after the session is completed.</li>
        </ul>
        <p>
          <Link href="/payouts" className="text-primary text-body font-semibold underline-offset-2 hover:underline">
            View earnings and payout history
          </Link>
        </p>
      </SettingGroup>
    </div>
  );
}
