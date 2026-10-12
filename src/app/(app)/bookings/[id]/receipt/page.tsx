import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Receipt as ReceiptIcon } from "lucide-react";
import { BackLink, PageHeader } from "@/components/layout";
import { Wordmark } from "@/components/layout/wordmark";
import { Badge } from "@/components/atoms";
import { Banner, EmptyState } from "@/components/molecules";
import { fmtDay, fmtTime, rupees } from "@/lib/booking/time";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import type { Receipt } from "@/lib/booking/types";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Receipt" };

function Line({ label, value, strong, tone }: { label: string; value: React.ReactNode; strong?: boolean; tone?: "danger" }) {
  return (
    <div className={`flex items-baseline justify-between gap-6 py-1.5 ${strong ? "border-border-light mt-2 border-t pt-3" : ""}`}>
      <dt className={`text-body ${strong ? "text-text-primary font-semibold" : "text-text-secondary"}`}>{label}</dt>
      <dd className={`text-body text-right tabular-nums ${strong ? "text-heading text-text-primary font-extrabold" : tone === "danger" ? "text-danger" : "text-text-primary"}`}>{value}</dd>
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-small text-text-secondary uppercase tracking-wide">{label}</p>
      <div className="text-body text-text-primary mt-1">{children}</div>
    </div>
  );
}

/**
 * The receipt for a paid booking. The booker sees what they paid and what came back; the expert sees the fee and what they earn.
 * A stranger, or a booking with no payment, is a 404.
 */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const { id } = await params;
  if (!/^\d{1,18}$/.test(id)) notFound();

  const res = await ords<Receipt>(`/bookings/${id}/receipt`, { token: session.token });
  if (!res.ok) {
    if (res.status === 404) notFound();
    return <EmptyState icon={ReceiptIcon} title="We couldn’t load this receipt" description="Please refresh the page in a moment." />;
  }
  const r = res.data;
  const expert = r.role === "expert";

  const stateBadge =
    r.status === "REFUNDED" ? <Badge tone="danger">Refunded</Badge> : r.status === "REFUND_PENDING" ? <Badge tone="warning">Refund on its way</Badge> : <Badge tone="success">Paid</Badge>;

  return (
    <>
      <PageHeader back={<BackLink href="/bookings">My bookings</BackLink>} eyebrow={expert ? "Earnings" : "Receipt"} title={r.receiptNo} subtitle={`${r.serviceTitle} · ${fmtDay(r.startAt)}, ${fmtTime(r.startAt)}`} actions={<PrintButton />} />
      <div className="max-w-2xl space-y-5 pb-10">
        {!expert && r.status === "REFUND_PENDING" && r.refund && (
          <Banner tone="warning">
            Your refund of {rupees(r.refund.amountMinor)} is on its way back to the account you paid from. It should arrive by {fmtDay(r.refund.dueBy)}.
          </Banner>
        )}
        {!expert && r.status === "REFUNDED" && r.refund && (
          <Banner tone="success">Your refund of {rupees(r.refund.amountMinor)} was sent. Banks can take a few days to show it.</Banner>
        )}
        <article className="bg-surface-light ring-primary/10 overflow-hidden rounded-lg shadow-sm ring-1">
          <header className="border-border-light flex flex-wrap items-start justify-between gap-4 border-b px-6 py-5">
            <Wordmark dark size="md" />
            <div className="text-right">
              <p className="text-small text-text-secondary uppercase tracking-wide">{expert ? "Earnings statement" : "Payment receipt"}</p>
              <p className="text-body text-text-primary mt-1 font-semibold tabular-nums">{r.receiptNo}</p>
              <div className="mt-2">{stateBadge}</div>
            </div>
          </header>

          <div className="grid gap-5 px-6 py-5 sm:grid-cols-3">
            <Meta label={expert ? "Booked by" : "Paid to"}>{expert ? r.requesterName : r.expertName}</Meta>
            <Meta label="Paid on">
              {fmtDay(r.paidAt)}, {fmtTime(r.paidAt)}
            </Meta>
            <Meta label={expert ? "Payment" : "Payment reference"}>
              <span className="break-all">{expert ? "Held by GCODE" : (r.paymentRef ?? "—")}</span>
            </Meta>
          </div>

          <div className="bg-bg-subtle border-border-light border-y px-6 py-4">
            <p className="text-body text-text-primary font-semibold">{r.serviceTitle}</p>
            <p className="text-small text-text-secondary mt-0.5">
              {fmtDay(r.startAt)}, {fmtTime(r.startAt)} · {r.durationMin} min
            </p>
          </div>

          <dl className="px-6 py-4">
            <Line label={expert ? "The booker paid" : "Session fee"} value={rupees(r.amountMinor)} />
            {expert && r.earning && (
              <>
                <Line label={`GCODE fee (${r.earning.feePct}%)`} value={`− ${rupees(r.earning.feeMinor)}`} />
                <Line strong label="You earn" value={rupees(r.earning.netMinor)} />
              </>
            )}
            {!expert && r.refund && <Line label={`Refunded · ${r.refund.reasonLabel}`} value={`− ${rupees(r.refund.amountMinor)}`} tone="danger" />}
            {!expert && <Line strong label={r.refund ? "Net paid" : "Total paid"} value={rupees(r.amountMinor - (r.refund?.amountMinor ?? 0))} />}
          </dl>

          {expert && r.earning && (
            <div className="border-border-light flex items-center justify-between gap-4 border-t px-6 py-3">
              <span className="text-small text-text-secondary">Status</span>
              <Badge tone={r.earning.settlement === "RELEASED" ? "success" : r.earning.settlement === "REFUNDED" ? "danger" : "warning"}>
                {r.earning.settlement === "RELEASED"
                  ? "Added to your payout balance"
                  : r.earning.settlement === "REFUNDED"
                    ? "Refunded to the booker"
                    : r.earning.releasesOn
                      ? `Held until ${fmtDay(r.earning.releasesOn)}`
                      : "Held until the session happens"}
              </Badge>
            </div>
          )}
          {!expert && r.refund && (
            <div className="border-border-light flex items-center justify-between gap-4 border-t px-6 py-3">
              <span className="text-small text-text-secondary">Refund status</span>
              <Badge tone={r.refund.status === "DONE" ? "success" : "warning"}>{r.refund.status === "DONE" ? "Sent" : "On its way"}</Badge>
            </div>
          )}
        </article>
        <p className="text-small text-text-secondary">
          {expert
            ? "Your share is released a week after the session, which leaves time for any problem report. After that it is paid out every Monday to the account in Settings → Payouts."
            : "GCODE holds your payment until the expert accepts and the session happens. Questions? Reply to any of our emails."}
        </p>
      </div>
    </>
  );
}
