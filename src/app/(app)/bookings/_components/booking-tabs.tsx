"use client";

import { useRouter } from "next/navigation";
import { ToggleGroup } from "@/components/molecules";
import { BOOKING_TABS, type BookingTab } from "@/lib/booking/types";

const LABEL: Record<BookingTab, string> = { upcoming: "Upcoming", completed: "Completed", cancelled: "Cancelled / Rejected" };

/** The segmented control from the wireframe: three tabs, each with a count pill when it has anything in it. */
export function BookingTabs({ active, counts }: { active: BookingTab; counts: Record<BookingTab, number> }) {
  const router = useRouter();
  return (
    <ToggleGroup
      ariaLabel="Bookings view"
      value={active}
      onChange={(value) => router.push(value === "upcoming" ? "/bookings" : `/bookings?tab=${value}`)}
      options={BOOKING_TABS.map((t) => ({
        value: t,
        label: (
          <>
            {LABEL[t]}
            {counts[t] > 0 && (
              <span
                className={`text-small ml-2 rounded-full px-1.5 py-0.5 leading-none font-semibold ${
                  t === active ? "bg-secondary-light text-secondary" : "bg-surface-light text-text-secondary"
                }`}
              >
                {counts[t]}
              </span>
            )}
          </>
        ),
      }))}
    />
  );
}
