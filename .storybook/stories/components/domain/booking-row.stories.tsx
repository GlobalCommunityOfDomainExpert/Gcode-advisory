import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookingRow } from "@/components/domain/booking-row";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: BookingRow,
  tags: ["ai-generated"],
  args: { side: "consulting", booking: { id: "x", status: "pending", name: "Meera Nair", topic: "Hiring guidance", month: "Oct", day: "09", when: "Fri · 3:00 PM · 30 min", detail: "₹1,200 paid" } },
} satisfies Meta<typeof BookingRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
const photo = (g: string, n: number) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;

const scheduled = { id: "c1", status: "scheduled", name: "Kashish Lewis", topic: "Product strategy session", month: "Sep", day: "29", when: "Tue · 10:00 AM · 30 min", detail: "FREE · Video link is ready", soon: true, avatarSrc: photo("women", 44) } as const;
const pending = { id: "c4", status: "pending", name: "Meera Nair", topic: "Hiring guidance", month: "Oct", day: "09", when: "Fri · 3:00 PM · 30 min", detail: "₹1,200 paid · held until Meera accepts · replies within 24 hours", avatarSrc: photo("women", 68) } as const;
const theyProposed = { id: "c3", status: "reschedule", by: "them", name: "Arup Mohanty", topic: "Go-to-market review", month: "Oct", day: "06", when: "Tue · 11:00 AM · 60 min", detail: "₹3,000 paid · held until the session is done", proposed: { label: "Thu, 8 Oct · 3:00 PM" }, reason: "I have a clash at the original time.", avatarSrc: photo("men", 52) } as const;
const youProposed = { id: "c5", status: "reschedule", by: "you", name: "Priya Menon", topic: "Portfolio review", month: "Oct", day: "12", when: "Mon · 10:00 AM · 45 min", detail: "₹1,800 paid · your original time stands until Priya accepts", proposed: { label: "Wed, 14 Oct · 11:00 AM" }, reason: "Schedule conflict", avatarSrc: photo("women", 63) } as const;
const newRequest = { id: "e1", status: "pending", name: "Riya Kapoor", topic: "Career switch into product management", month: "Oct", day: "05", when: "Mon · 10:00 AM · 30 min", detail: "Paid ₹1,500 · held until you accept · you earn ₹1,275 after the 15% platform fee", avatarSrc: photo("women", 33) } as const;
const completed = { id: "c6", status: "completed", name: "Sohaib Rahman", topic: "Resume feedback", month: "Sep", day: "12", when: "Sat · 3:00 PM · 30 min", detail: "₹1,000", avatarSrc: photo("men", 65) } as const;
const declined = { id: "c8", status: "declined", name: "Dev Patel", topic: "Mock interview", month: "Sep", day: "05", when: "Sat · 4:00 PM · 30 min", detail: "Declined by the expert · Reason: Not available at that time", refund: "₹1,000 refunded in full · reaches your original payment method within 7 days", avatarSrc: photo("men", 22) } as const;
const cancelled = { id: "c9", status: "cancelled", name: "Isha Roy", topic: "Interview preparation", month: "Aug", day: "22", when: "Sat · 11:00 AM · 30 min", detail: "Cancelled by you · Reason: Schedule conflict", refund: "₹1,000 refunded in full · arrived in 4 days", avatarSrc: photo("women", 79) } as const;

export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Consulting · confirmed" kind="selected" wide fill tint><BookingRow side="consulting" booking={scheduled} /></Cell>
      <Cell label="Consulting · awaiting response" kind="empty" wide fill tint><BookingRow side="consulting" booking={pending} /></Cell>
      <Cell label="Reschedule · they proposed" kind="empty" wide fill tint><BookingRow side="consulting" booking={theyProposed} /></Cell>
      <Cell label="Reschedule · you proposed" kind="empty" wide fill tint><BookingRow side="consulting" booking={youProposed} /></Cell>
      <Cell label="Expert · new request" kind="empty" wide fill tint><BookingRow side="expert" booking={newRequest} /></Cell>
      <Cell label="Completed" wide fill tint><BookingRow side="consulting" booking={completed} /></Cell>
      <Cell label="Declined" kind="error" wide fill tint><BookingRow side="consulting" booking={declined} /></Cell>
      <Cell label="Cancelled" kind="error" wide fill tint><BookingRow side="consulting" booking={cancelled} /></Cell>
    </CellGrid>
  ),
};
