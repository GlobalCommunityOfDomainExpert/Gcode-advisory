import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Divider } from "@/components/atoms/divider";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Divider,
  tags: ["ai-generated"],
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("separator")).not.toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default" fill><Divider /></Cell>
    </CellGrid>
  ),
};
