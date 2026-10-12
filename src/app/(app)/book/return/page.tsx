import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ORDER_ID } from "@/lib/server/payments";
import { getSession } from "@/lib/server/session";
import { PaymentReturn } from "./_components/payment-return";

export const metadata: Metadata = { title: "Payment" };

/**
 * Where Cashfree sends the customer back to: /book/return?order_id=GCB42N1. Nothing in the address is believed: the page
 * asks our server, which asks Cashfree, what happened to that order.
 */
export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const { order_id: orderId } = await searchParams;

  return (
    <div className="py-8">
      <PaymentReturn orderId={typeof orderId === "string" && ORDER_ID.test(orderId) ? orderId : null} />
    </div>
  );
}
