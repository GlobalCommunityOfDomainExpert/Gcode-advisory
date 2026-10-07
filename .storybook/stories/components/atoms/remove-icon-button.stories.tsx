import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RemoveIconButton } from "@/components/atoms/remove-icon-button";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: RemoveIconButton,
  tags: ["ai-generated"],
  args: { ariaLabel: "Remove", onClick: () => {} },
} satisfies Meta<typeof RemoveIconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default"><RemoveIconButton ariaLabel="Remove role" onClick={() => {}} /></Cell>
      <Cell label="Hover" kind="interactive"><span className="contents"><span className="[&>button]:text-danger! contents"><RemoveIconButton ariaLabel="Remove role" onClick={() => {}} /></span></span></Cell>
      <Cell label="Focus" kind="interactive"><span className="contents"><span className="[&>button]:ring-2! [&>button]:ring-primary! [&>button]:ring-offset-2! contents"><RemoveIconButton ariaLabel="Remove role" onClick={() => {}} /></span></span></Cell>
    </CellGrid>
  ),
};
