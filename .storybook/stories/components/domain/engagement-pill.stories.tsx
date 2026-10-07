import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EngagementPill } from "@/components/domain/engagement-pill";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: EngagementPill,
  tags: ["ai-generated"],
  args: { type: "paid" },
} satisfies Meta<typeof EngagementPill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      {(["paid", "free", "community"] as const).map((t) => (
        <Cell key={t} label={t} kind="variant"><EngagementPill type={t} /></Cell>
      ))}
    </CellGrid>
  ),
};
