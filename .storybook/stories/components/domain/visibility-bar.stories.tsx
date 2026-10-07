import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VisibilityBar } from "@/components/domain/visibility-bar";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: VisibilityBar,
  tags: ["ai-generated"],
  args: { published: false, percent: 60, sectionsLeft: 1, where: "Find Experts" },
} satisfies Meta<typeof VisibilityBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Incomplete · hidden" kind="empty" fill>
        <VisibilityBar published={false} percent={60} sectionsLeft={1} where="Find Experts" />
      </Cell>
      <Cell label="Complete · ready" fill>
        <VisibilityBar published={false} percent={100} sectionsLeft={0} where="Find Experts" />
      </Cell>
      <Cell label="Published · live" kind="selected" fill>
        <VisibilityBar published percent={100} sectionsLeft={0} where="Find Experts" />
      </Cell>
    </CellGrid>
  ),
};
