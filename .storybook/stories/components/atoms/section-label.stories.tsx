import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionLabel } from "@/components/atoms/section-label";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: SectionLabel,
  tags: ["ai-generated"],
  args: {
    children: "Featured",
  },
} satisfies Meta<typeof SectionLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default"><SectionLabel>Account</SectionLabel></Cell>
      <Cell label="On tint (override colour)" kind="variant"><SectionLabel className="text-primary!">Next step</SectionLabel></Cell>
    </CellGrid>
  ),
};
