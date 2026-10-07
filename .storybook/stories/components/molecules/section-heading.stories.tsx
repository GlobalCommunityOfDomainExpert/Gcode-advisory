import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionHeading } from "@/components/molecules/section-heading";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: SectionHeading,
  tags: ["ai-generated"],
  args: { title: "Upcoming", subtitle: "Confirmed and awaiting response" },
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default" fill><SectionHeading title="Upcoming" subtitle="Confirmed and awaiting response" /></Cell>
    </CellGrid>
  ),
};
