import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Receipt as ReceiptIcon } from "lucide-react";
import { BackLink, PageHeader } from "@/components/layout";
import { Badge } from "@/components/atoms";
import { Banner, EmptyState } from "@/components/molecules";
import { fmtDay, fmtTime, rupees } from "@/lib/booking/time";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import type { Receipt } from "@/lib/booking/types";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Receipt" };

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="border-border-light flex items-baseline justify-between gap-6 border-b py-3 last:border-b-0">
      <dt className="text-body text-text-secondary">{label}</dt>
      <dd className={`text-body text-right tabular-nums ${strong ? "text-text-primary font-extrabold" : "text-text-primary"}`}>{value}</dd>
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

  return (
    <>
      <PageHeader back={<BackLink href="/bookings">My bookings</BackLink>} eyebrow={expert ? "Earnings" : "Receipt"} title={r.receiptNo} subtitle={`${r.serviceTitle} · ${fmtDay(r.startAt)}, ${fmtTime(r.startAt)}`} actions={<PrintButton />} />
      <div className="max-w-xl space-y-5 pb-10">
        {r.status === "REFUND_PENDING" && r.refund && (
          <Banner tone="warning">
            Your refund of {rupees(r.refund.amountMinor)} is on its way back to the account you paid from. It should arrive by {fmtDay(r.refund.dueBy)}.
          </Banner>
        )}
        {r.status === "REFUNDED" && r.refund && (
          <Banner tone="success">Your refund of {rupees(r.refund.amountMinor)} was sent. Banks can take a few days to show it.</Banner>
        )}
        <dl className="bg-surface-light ring-primary/10 rounded-lg px-6 py-3 shadow-sm ring-1">
          <Row label="Session" value={r.serviceTitle} />
          <Row label="With" value={expert ? r.requesterName : r.expertName} />
          <Row label="When" value={`${fmtDay(r.startAt)}, ${fmtTime(r.startAt)} (${r.durationMin} min)`} />
          <Row label="Paid on" value={`${fmtDay(r.paidAt)}, ${fmtTime(r.paidAt)}`} />
          {r.paymentRef && !expert && <Row label="Payment reference" value={r.paymentRef} />}
          <Row label={expert ? "The booker paid" : "Amount paid"} value={rupees(r.amountMinor)} strong={!expert} />
          {expert && r.earning && (
            <>
              <Row label={`GCODE fee (${r.earning.feePct}%)`} value={`− ${rupees(r.earning.feeMinor)}`} />
              <Row label="You earn" value={rupees(r.earning.netMinor)} strong />
              <Row
                label="Status"
                value={
                  <Badge tone={r.earning.settlement === "RELEASED" ? "success" : r.earning.settlement === "REFUNDED" ? "danger" : "warning"}>
                    {r.earning.settlement === "RELEASED" ? "Added to your payout balance" : r.earning.settlement === "REFUNDED" ? "Refunded to the booker" : "Held until the session happens"}
                  </Badge>
                }
              />
            </>
          )}
          {!expert && r.refund && (
            <>
              <Row label="Refunded" value={`− ${rupees(r.refund.amountMinor)}`} />
              <Row label="Reason" value={r.refund.reasonLabel} />
              <Row label="Refund status" value={<Badge tone={r.refund.status === "DONE" ? "success" : "warning"}>{r.refund.status === "DONE" ? "Sent" : "On its way"}</Badge>} />
            </>
          )}
        </dl>
        <p className="text-small text-text-secondary">
          {expert
            ? "Earnings are paid out every Monday to the account in Settings → Payouts."
            : "GCODE holds your payment until the expert accepts and the session happens. Questions? Reply to any of our emails."}
        </p>
      </div>
    </>
  );
}
