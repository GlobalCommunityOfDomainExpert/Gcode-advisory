import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FocusTile } from "@/components/domain/focus-tile";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: FocusTile,
  tags: ["ai-generated"],
  args: { eyebrow: "Today", value: "3", label: "booking requests", text: "Accept or decline within 24 hours.", cta: "Review requests" },
} satisfies Meta<typeof FocusTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Normal" wide fill>
        <FocusTile eyebrow="Today" value="3" label="booking requests" text="Accept or decline within 24 hours." cta="Review requests" cta2="View calendar" />
      </Cell>
      <Cell label="Urgent · incomplete profile" kind="empty" wide fill>
        <FocusTile eyebrow="Finish setup" value="40%" label="profile complete" text="Nobody can see or book you until it is done." cta="Continue profile" ring={40} />
      </Cell>
    </CellGrid>
  ),
};
