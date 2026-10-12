import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { ButtonLink } from "@/components/atoms";
import { Banner, EmptyState, PAGE_SIZE, PageNav, pageFrom, skipFor } from "@/components/molecules";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import { BOOKING_TABS, type BookingList as BookingListData, type BookingReason, type BookingTab } from "@/lib/booking/types";
import { BookingList } from "./_components/booking-list";
import { BookingTabs } from "./_components/booking-tabs";

export const metadata: Metadata = { title: "My bookings" };

/** Sessions you booked and requests you received, in three tabs. The backend decides which buttons each booking shows. */
export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { tab: rawTab, page: rawPage } = await searchParams;
  const page = pageFrom(rawPage);
  const tab: BookingTab = BOOKING_TABS.find((t) => t === rawTab) ?? "upcoming";

  const [res, reasons] = await Promise.all([
    ords<BookingListData>(`/bookings/me?tab=${tab}&page_skip=${skipFor(page)}&page_len=${PAGE_SIZE}`, { token: session.token }),
    ords<BookingReason[]>("/bookings/reasons", { token: session.token }),
  ]);
  // a page past the end (an old link, or the last card was just removed) goes back to the first page
  if (res.ok && page > 1 && res.data.items.length === 0) redirect(`/bookings?tab=${tab}`);
  const isExpert = session.roleName === "EXPERT";

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="My Bookings"
        subtitle={isExpert ? "Respond to requests and manage your sessions." : "Track your requests and sessions."}
        actions={
          res.ok ? (
            <>
              <BookingTabs active={tab} counts={res.data.counts} />
              {isExpert && (
                <ButtonLink href="/profile" variant="outline">
                  Services &amp; availability
                </ButtonLink>
              )}
            </>
          ) : undefined
        }
      />
      {!res.ok ? (
        <EmptyState icon={CalendarClock} title="We couldn’t load your bookings" description="Please refresh the page in a moment." />
      ) : res.data.items.length === 0 ? (
        <div className="border-border-hover bg-surface-light/60 rounded-md border-2 border-dashed">
          <Empty tab={tab} isExpert={isExpert} />
        </div>
      ) : (
        <div className="pb-8">
          {tab === "upcoming" && (
            <div className="mb-6">
              <Banner tone="info">
                {isExpert
                  ? "Reply within 24 hours or a request expires. If you decline or cancel, the booker is told and you give a reason. Either side can propose a new time; the other has to accept."
                  : "The expert has 24 hours to accept your request. Whoever cancels gives a reason, and the other person is told. Need a different time? Either side can propose one; the other has to accept."}
              </Banner>
            </div>
          )}
          <BookingList items={res.data.items} reasons={reasons.ok ? reasons.data : []} grouped={tab === "upcoming"} />
          <PageNav page={page} hasMore={!!res.data.hasMore} href={(n) => `/bookings?tab=${tab}${n > 1 ? `&page=${n}` : ""}`} label="More bookings" />
        </div>
      )}
    </>
  );
}

function Empty({ tab, isExpert }: { tab: BookingTab; isExpert: boolean }) {
  if (tab === "upcoming") {
    return isExpert ? (
      <EmptyState
        icon={CalendarClock}
        title="No upcoming sessions"
        description="Requests from people who book you show up here. Make sure your services and hours are set."
        action={
          <ButtonLink href="/profile" size="sm">
            Edit your services
          </ButtonLink>
        }
      />
    ) : (
      <EmptyState
        icon={CalendarClock}
        title="No upcoming sessions"
        description="Find an expert and book a time that suits you."
        action={
          <ButtonLink href="/directory" size="sm">
            Find an expert
          </ButtonLink>
        }
      />
    );
  }
  return (
    <EmptyState
      icon={CalendarClock}
      title={tab === "completed" ? "No completed sessions yet" : "Nothing cancelled"}
      description={tab === "completed" ? "Sessions that have taken place appear here." : "Declined, cancelled and expired bookings appear here."}
    />
  );
}
