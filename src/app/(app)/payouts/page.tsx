import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Landmark, Receipt, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Badge, ButtonLink, Icon, SectionLabel } from "@/components/atoms";
import type { BadgeTone } from "@/components/atoms";
import { Banner, EmptyState } from "@/components/molecules";
import { fmtDay, rupees as price } from "@/lib/booking/time";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import type { Earnings, EarningStatus, PayoutAccount, PayoutStatus } from "@/lib/booking/types";

export const metadata: Metadata = { title: "Payouts" };

/** Balances are money even at zero ("Free" is for prices). */
const rupees = (minor: number) => (minor === 0 ? "₹0" : price(minor));

const EARNING_LABEL: Record<EarningStatus, [string, BadgeTone]> = {
  available: ["Available", "success"],
  pending: ["In escrow", "warning"],
  paid: ["Paid out", "neutral"],
};
const FILTERS: [string, string][] = [
  ["all", "All"],
  ["available", "Available"],
  ["pending", "In escrow"],
  ["paid", "Paid out"],
];
const PAYOUT_LABEL: Record<PayoutStatus, [string, BadgeTone]> = {
  REQUESTED: ["Scheduled", "warning"],
  PROCESSING: ["On its way", "warning"],
  PAID: ["Paid", "success"],
  FAILED: ["Failed", "danger"],
};

function Pills({ items, active, href, label }: { items: [string, string][]; active: string; href: (key: string) => string; label: string }) {
  return (
    <div role="group" aria-label={label} className="border-border-light bg-bg-light inline-flex max-w-full overflow-x-auto rounded-sm border p-1">
      {items.map(([key, text]) => (
        <Link
          key={key}
          href={href(key)}
          aria-current={key === active ? "true" : undefined}
          className={`text-small focus-visible:ring-primary inline-flex shrink-0 items-center rounded-sm px-3 py-1.5 font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none ${
            key === active ? "bg-surface-light text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {text}
        </Link>
      ))}
    </div>
  );
}

const th = "text-text-secondary px-5 py-3 font-medium tracking-wide uppercase";

/**
 * Experts' earnings, as in the wireframe: balance, every paid session as gross, 15% fee and net, and the payout history.
 * The payout ACCOUNT is private account data and lives in Account settings; this page is where you track the money.
 */
export default async function PayoutsPage({ searchParams }: { searchParams: Promise<{ view?: string; filter?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.roleName !== "EXPERT") redirect("/bookings");

  const { view: rawView, filter: rawFilter } = await searchParams;
  const view = rawView === "history" ? "history" : "earnings";
  const filter = FILTERS.some(([k]) => k === rawFilter) ? (rawFilter as string) : "all";

  const [earn, acct] = await Promise.all([
    ords<Earnings>("/payouts/earnings", { token: session.token }),
    ords<PayoutAccount>("/payouts/account", { token: session.token }),
  ]);

  if (!earn.ok || !acct.ok) {
    return (
      <>
        <PageHeader eyebrow="Earnings" title="Payouts" />
        <Banner tone="danger">We couldn’t load your earnings. Please refresh the page in a moment.</Banner>
      </>
    );
  }
  const e = earn.data;
  const a = acct.data;
  const configured = a.hasAccount;
  const rows = e.sessions.filter((s) => filter === "all" || s.status === filter);
  const where = a.method === "UPI" ? a.upiMasked : `Bank account ending ${a.accountLast4}`;

  return (
    <>
      <PageHeader
        eyebrow="Earnings"
        title="Payouts"
        subtitle={configured ? "Track what you’ve earned and when it reaches you." : "Your earnings are waiting. Add a payout account to receive them."}
      />
      <div className="space-y-8 pb-8">
        {!e.paymentsEnabled && <Banner tone="info">Paid sessions are not switched on yet. Your earnings will appear here once they are.</Banner>}

        {configured ? (
          <>
            <div className="bg-surface-light divide-border-light ring-primary/10 grid divide-y rounded-lg shadow-sm ring-1 lg:grid-cols-[1.4fr_1fr_1fr] lg:divide-x lg:divide-y-0">
              <div className="p-6">
                <p className="text-small text-text-secondary font-medium">Available to pay out</p>
                <p className="text-display text-text-primary mt-1 font-extrabold tabular-nums">{rupees(e.availableMinor)}</p>
                <p className="text-small text-text-secondary mt-1">
                  Next payout: {fmtDay(e.nextBatchOn)}
                  {e.onTheWayMinor > 0 ? ` · ${rupees(e.onTheWayMinor)} already on its way` : ""}
                </p>
              </div>
              <div className="p-6">
                <p className="text-small text-text-secondary font-medium">In escrow</p>
                <p className="text-heading text-text-primary mt-1 font-extrabold tabular-nums">{rupees(e.upcomingMinor)}</p>
                <p className="text-small text-text-secondary mt-1">Released after the session ends</p>
              </div>
              <div className="p-6">
                <p className="text-small text-text-secondary font-medium">Lifetime earnings (net)</p>
                <p className="text-heading text-text-primary mt-1 font-extrabold tabular-nums">{rupees(e.lifetimeNetMinor)}</p>
                <p className="text-small text-text-secondary mt-1">After the 15% platform fee</p>
              </div>
            </div>

            <div className="bg-surface-light ring-primary/10 flex flex-wrap items-center gap-4 rounded-lg p-5 shadow-sm ring-1">
              <span className="bg-success-light text-success grid size-11 shrink-0 place-items-center rounded-md">
                <Icon icon={Landmark} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body text-text-primary font-semibold">{where}</p>
                <p className="text-small text-text-secondary">Payouts go here every Monday, from {rupees(e.minPayoutMinor)}.</p>
              </div>
              <ButtonLink href="/settings?section=payouts" variant="secondary" size="sm">
                Manage payout account
              </ButtonLink>
            </div>
          </>
        ) : (
          <div className="bg-surface-light ring-primary/10 rounded-lg p-6 shadow-sm ring-1 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="bg-warning-light text-warning grid size-12 shrink-0 place-items-center rounded-md">
                  <Icon icon={Wallet} size="lg" />
                </span>
                <div>
                  <h2 className="text-large text-text-primary font-bold">{rupees(e.availableMinor)} is ready to be paid out</h2>
                  <p className="text-body text-text-secondary mt-1 max-w-xl">
                    Add a payout account and we’ll send your earnings on Monday. Until then, paid sessions stay paused. You can still offer free sessions.
                  </p>
                </div>
              </div>
              <ButtonLink href="/settings?section=payouts">
                Add payout account <Icon icon={ArrowRight} size="sm" />
              </ButtonLink>
            </div>
            <ol className="text-small text-text-secondary mt-6 grid gap-3 sm:grid-cols-3">
              {["Add a bank account or UPI id in Account settings → Payouts", "Each session’s money is released a week after it, then paid out every Monday", "GCODE keeps 15% of paid sessions"].map((t, i) => (
                <li key={t} className="bg-bg-subtle border-border-light flex items-start gap-3 rounded-md border p-4">
                  <span className="bg-primary-light text-primary grid size-6 shrink-0 place-items-center rounded-full font-bold">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="space-y-4">
          {configured ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Pills
                label="Payouts view"
                active={view}
                items={[["earnings", "Earnings"], ["history", "Payout history"]]}
                href={(k) => `/payouts?view=${k}`}
              />
              {view === "earnings" && <Pills label="Filter by status" active={filter} items={FILTERS} href={(k) => `/payouts?filter=${k}`} />}
            </div>
          ) : (
            <SectionLabel className="mb-4">Your earnings so far</SectionLabel>
          )}

          {view === "history" && configured ? (
            e.payouts.length === 0 ? (
              <div className="border-border-hover rounded-md border-2 border-dashed">
                <EmptyState icon={Receipt} title="No payouts yet" description={`The first goes out on the Monday after you have earned ${rupees(e.minPayoutMinor)}.`} />
              </div>
            ) : (
              <div className="border-border-light bg-surface-light overflow-x-auto rounded-md border shadow-sm">
                <table className="text-small w-full min-w-[36rem] text-left">
                  <thead>
                    <tr className="border-border-light border-b">
                      {["Date", "Reference", "Amount", "To", "Status"].map((h, i) => (
                        <th key={h} className={`${th} ${i === 2 ? "text-right" : ""}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {e.payouts.map((p) => {
                      const [label, tone] = PAYOUT_LABEL[p.status];
                      return (
                        <tr key={p.id} className="border-border-light hover:bg-bg-subtle border-b align-top last:border-0">
                          <td className="text-text-secondary px-5 py-3.5 whitespace-nowrap">{fmtDay(p.paidAt ?? p.createdAt)}</td>
                          <td className="text-text-primary px-5 py-3.5 font-mono">
                            {p.ref}
                            {p.utr && <span className="text-text-secondary block font-sans text-xs">Bank ref {p.utr}</span>}
                          </td>
                          <td className="text-text-primary px-5 py-3.5 text-right font-semibold tabular-nums">{rupees(p.amountMinor)}</td>
                          <td className="text-text-secondary px-5 py-3.5">{p.to}</td>
                          <td className="px-5 py-3.5">
                            <Badge tone={tone}>{label}</Badge>
                            {p.note && <p className="text-danger mt-1 max-w-xs text-xs">{p.note}</p>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : rows.length === 0 ? (
            <div className="border-border-hover rounded-md border-2 border-dashed">
              <EmptyState icon={Receipt} title="Nothing here" description={filter === "all" ? "Paid sessions you complete show up here." : "No sessions with this status yet."} />
            </div>
          ) : (
            <>
              <div className="bg-surface-light ring-primary/10 overflow-x-auto rounded-lg shadow-sm ring-1">
                <table className="text-small w-full min-w-[40rem] text-left">
                  <thead>
                    <tr className="border-border-light border-b">
                      {["Date", "Session", "Gross", "Platform fee (15%)", "Net to you", "Status"].map((h, i) => (
                        <th key={h} className={`${th} ${i >= 2 && i <= 4 ? "text-right" : ""}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const [label, tone] = EARNING_LABEL[r.status];
                      return (
                        <tr key={r.bookingId} className="border-border-light hover:bg-bg-subtle border-b last:border-0">
                          <td className="text-text-secondary px-5 py-3.5 whitespace-nowrap">{fmtDay(r.startAt)}</td>
                          <td className="px-5 py-3.5">
                            <Link href={`/bookings/${r.bookingId}/receipt`} className="text-body text-text-primary font-medium hover:underline">
                              {r.serviceTitle}
                            </Link>
                            <p className="text-small text-text-secondary">with {r.requesterName}</p>
                          </td>
                          <td className="text-text-primary px-5 py-3.5 text-right tabular-nums">{rupees(r.grossMinor)}</td>
                          <td className="text-text-secondary px-5 py-3.5 text-right tabular-nums">−{rupees(r.feeMinor)}</td>
                          <td className="text-text-primary px-5 py-3.5 text-right font-semibold tabular-nums">{rupees(r.netMinor)}</td>
                          <td className="px-5 py-3.5">
                            <Badge tone={tone}>{label}</Badge>
                            {r.status === "pending" && r.releasesOn && <p className="text-small text-text-secondary mt-1">Releases {fmtDay(r.releasesOn)}</p>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-small text-text-secondary mt-3 flex items-start gap-2">
                <Icon icon={Receipt} size="sm" className="mt-0.5" />
                GCODE keeps 15% of each paid session. Free sessions carry no fee. Money is released to you after the session is completed.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
