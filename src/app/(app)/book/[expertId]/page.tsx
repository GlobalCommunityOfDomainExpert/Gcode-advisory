import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CalendarX, UserX } from "lucide-react";
import { BackLink, PageHeader } from "@/components/layout";
import { ButtonLink } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import { findRescueOffer } from "@/lib/server/rescue";
import type { ExpertPage } from "@/lib/booking/types";
import { BookingFlow } from "./_components/booking-flow";

export const metadata: Metadata = { title: "Book a session" };

/** Book a session with one expert: service, date and time, a message, then payment. The (app) layout guarantees a signed-in user. */
export default async function BookPage({ params, searchParams }: { params: Promise<{ expertId: string }>; searchParams: Promise<{ service?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { expertId } = await params;
  if (!/^\d{1,40}$/.test(expertId)) notFound();

  const res = await ords<ExpertPage>(`/directory/experts/${expertId}`, { token: session.token });
  if (!res.ok) {
    if (res.status === 404) notFound();
    return <EmptyState icon={UserX} title="We couldn’t load this expert" description="Please refresh the page in a moment." />;
  }
  const expert = res.data;
  const back = <BackLink href="/directory">Directory</BackLink>;

  if (session.userId === expert.userId) {
    return (
      <>
        <PageHeader back={back} title="This is your own profile" />
        <EmptyState icon={UserX} title="You can’t book yourself" description="Share your profile and let others book you." action={<ButtonLink href="/directory" variant="secondary" size="sm">Back to directory</ButtonLink>} />
      </>
    );
  }

  if (!expert.bookable || expert.services.length === 0) {
    return (
      <>
        <PageHeader back={back} title={`Book a session with ${expert.name}`} />
        <EmptyState
          icon={CalendarX}
          title="Not taking bookings right now"
          description={expert.status === "COMMUNITY" ? `${expert.name} is a community member and isn’t offering sessions.` : `${expert.name} hasn’t set up a service yet.`}
          action={<ButtonLink href="/directory" variant="secondary" size="sm">Back to directory</ButtonLink>}
        />
      </>
    );
  }

  const { service } = await searchParams;
  const wanted = expert.services.find((s) => String(s.id) === service);

  // A paid session that was not kept can be carried on with this expert. That service must not start a new booking (it would ask
  // for payment again): it goes to the expert's page, which continues the paid session. The other services book as usual.
  const found = await findRescueOffer(session.token, expert.userId);
  const rescue = found ? { serviceId: found.offer.serviceId, href: `/experts/${expert.slug}?keep=1` } : undefined;
  if (rescue && (wanted?.id === rescue.serviceId || expert.services.every((s) => s.id === rescue.serviceId))) redirect(rescue.href);
  const initial = wanted ?? expert.services.find((s) => s.id !== rescue?.serviceId) ?? expert.services[0];

  return (
    <>
      <PageHeader back={back} title={`Book a session with ${expert.name}`} />
      <BookingFlow expert={expert} initialServiceId={initial.id} rescue={rescue} />
    </>
  );
}
