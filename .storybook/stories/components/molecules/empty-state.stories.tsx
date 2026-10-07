import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarX, Inbox } from "lucide-react";
import { ButtonLink } from "@/components/atoms";
import { EmptyState } from "@/components/molecules/empty-state";
import { Cell, CellGrid } from "../../_cell";
import { Button } from "@/components/atoms";

const meta = {
  component: EmptyState,
  tags: ["ai-generated"],
  args: {
    icon: CalendarX,
    title: "Nothing in this range",
    description:
      "Try a wider date range, or browse events to register for more.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: (
      <ButtonLink href="/events" variant="primary">
        Browse Events
      </ButtonLink>
    ),
  },
};

export const NoIcon: Story = { args: { icon: undefined } };

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="With action" kind="empty" fill>
        <EmptyState
          bordered={false}
          icon={CalendarX}
          title="No bookings yet"
          description="Find an expert and book your first session."
          action={<Button>Find an expert</Button>}
        />
      </Cell>
      <Cell label="No action" kind="empty" fill>
        <EmptyState bordered={false} icon={Inbox} title="You’re all caught up" description="New requests will show up here." />
      </Cell>
    </CellGrid>
  ),
};
