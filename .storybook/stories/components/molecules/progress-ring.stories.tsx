import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProgressRing } from "@/components/molecules/progress-ring";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: ProgressRing,
  tags: ["ai-generated"],
  args: { value: 45 },
} satisfies Meta<typeof ProgressRing>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="0 %" kind="empty"><ProgressRing value={0} /></Cell>
      <Cell label="45 %"><ProgressRing value={45} /></Cell>
      <Cell label="100 %" kind="selected"><ProgressRing value={100} /></Cell>
    </CellGrid>
  ),
};
