import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { AddItemButton } from "@/components/molecules/add-item-button";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: AddItemButton,
  tags: ["ai-generated"],
  args: { label: "Add Another Position" },
} satisfies Meta<typeof AddItemButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "+ Add Another Position" }),
    ).toBeVisible();
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default" fill><AddItemButton label="Add another role" /></Cell>
      <Cell label="Hover" kind="interactive" fill><span className="contents"><span className="[&>button]:bg-bg-light! contents"><AddItemButton label="Add another role" /></span></span></Cell>
    </CellGrid>
  ),
};
