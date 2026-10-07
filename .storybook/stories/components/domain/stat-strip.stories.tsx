import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatStrip } from "@/components/domain/stat-strip";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: StatStrip,
  tags: ["ai-generated"],
  args: { stats: [] },
} satisfies Meta<typeof StatStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="With trend" wide fill tint>
        <StatStrip
          stats={[
            { label: "Earnings", value: "₹18,400", trend: "+12%", sub: "after 15% fee" },
            { label: "Sessions", value: "9", sub: "this month" },
            { label: "Rating", value: "4.8", sub: "24 reviews" },
          ]}
        />
      </Cell>
      <Cell label="Empty values" kind="empty" wide fill tint>
        <StatStrip
          stats={[
            { label: "Earnings", value: "₹0", sub: "no sessions yet" },
            { label: "Sessions", value: "0", sub: "—" },
            { label: "Rating", value: "—", sub: "no reviews" },
          ]}
        />
      </Cell>
    </CellGrid>
  ),
};
