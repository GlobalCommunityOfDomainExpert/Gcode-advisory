import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Cell, CellGrid } from "../_cell";

const meta = {
  title: "Foundations/Radius & shadow",
  tags: ["ai-generated"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Radii 6 / 12 / 18. Shadows are soft and navy-tinted. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="rounded-sm" kind="variant" fill tint note="6px"><div className="bg-surface-light border-border-hover h-16 w-full rounded-sm border" /></Cell>
      <Cell label="rounded-md" kind="variant" fill tint note="12px"><div className="bg-surface-light border-border-hover h-16 w-full rounded-md border" /></Cell>
      <Cell label="rounded-lg" kind="variant" fill tint note="18px"><div className="bg-surface-light border-border-hover h-16 w-full rounded-lg border" /></Cell>
      <Cell label="shadow-sm" kind="variant" fill tint><div className="bg-surface-light h-16 w-full rounded-md shadow-sm" /></Cell>
      <Cell label="shadow-md" kind="variant" fill tint><div className="bg-surface-light h-16 w-full rounded-md shadow-md" /></Cell>
      <Cell label="shadow-lg" kind="variant" fill tint><div className="bg-surface-light h-16 w-full rounded-md shadow-lg" /></Cell>
    </CellGrid>
  ),
};
