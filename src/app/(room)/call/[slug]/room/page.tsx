import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import type { JoinInfo } from "@/lib/booking/types";
import { LocalRoom } from "../_components/local-room";

export const metadata: Metadata = { title: "In call" };

/**
 * The LOCAL provider's stand-in room, so tests and laptops need no video account. It asks the backend again, so the same
 * rules apply: only the two people, only while the room is open. The Zoho provider never uses this page.
 */
export default async function LocalRoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const slug = (await params).slug.toLowerCase();
  if (!/^[a-z0-9-]{8,20}$/.test(slug)) notFound();

  const res = await ords<JoinInfo>(`/bookings/call/${slug}`, { token: session.token });
  if (!res.ok) notFound();
  if (res.data.state !== "OPEN" || res.data.provider !== "LOCAL") redirect(`/call/${slug}`);

  return <LocalRoom title={res.data.serviceTitle} who={res.data.otherName} name={session.fullName || "You"} leaveHref="/bookings" endAt={res.data.endAt} slug={res.data.slug} bookingId={res.data.bookingId} />;
}
