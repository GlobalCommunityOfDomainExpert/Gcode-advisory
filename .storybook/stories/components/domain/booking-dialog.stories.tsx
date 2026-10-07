import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookingDialog } from "@/components/domain/booking-dialog";
import { Cell, CellGrid, Frame } from "../../_cell";

const meta = {
  component: BookingDialog,
  tags: ["ai-generated"],
  args: { kind: "cancel", side: "consulting", booking: { name: "Ashish Khanna", topic: "Roadmap review", month: "Oct", day: "02", when: "Fri · 5:00 PM · 45 min", paid: 2000 }, reasons: ["Schedule conflict", "Other"], reason: "", note: "", slot: null },
} satisfies Meta<typeof BookingDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
const ashish = { name: "Ashish Khanna", topic: "Roadmap review", month: "Oct", day: "02", when: "Fri · 5:00 PM · 45 min", paid: 2000, avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg" };
const riya = { name: "Riya Kapoor", topic: "Career switch into product management", month: "Oct", day: "05", when: "Mon · 10:00 AM · 30 min", paid: 1500, avatarSrc: "https://randomuser.me/api/portraits/women/33.jpg" };
const consultingReasons = ["Schedule conflict", "Booked by mistake", "Found another expert", "Emergency / personal", "Other"];
const expertReasons = ["Not available at that time", "Emergency / personal", "Topic outside my expertise", "Double-booked", "Other"];
const rescheduleReasons = ["Schedule conflict", "Emergency / personal", "Need more preparation time", "Other"];
const slots = [{ label: "Mon, 12 Oct · 10:00 AM" }, { label: "Tue, 13 Oct · 4:00 PM" }, { label: "Thu, 15 Oct · 11:00 AM" }, { label: "Fri, 16 Oct · 5:00 PM" }];

export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Cancel · confirm disabled" kind="disabled" frame fill>
        <Frame h="h-[40rem]">
          <BookingDialog inline kind="cancel" side="consulting" booking={ashish} reasons={consultingReasons} reason="" note="" slot={null} />
        </Frame>
      </Cell>
      <Cell label="Decline · reason chosen" kind="selected" frame fill>
        <Frame h="h-[40rem]">
          <BookingDialog inline kind="decline" side="expert" booking={riya} reasons={expertReasons} reason="Double-booked" note="" slot={null} />
        </Frame>
      </Cell>
      <Cell label="Reschedule · slot picked" kind="selected" wide frame fill>
        <Frame h="h-[40rem]">
          <BookingDialog inline kind="reschedule" side="consulting" booking={ashish} reasons={rescheduleReasons} slots={slots} reason="Schedule conflict" note="" slot={1} />
        </Frame>
      </Cell>
    </CellGrid>
  ),
};
