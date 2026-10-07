import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormSectionHeading } from "@/components/molecules/form-section-heading";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: FormSectionHeading,
  tags: ["ai-generated"],
  args: { title: "Basic Information" },
} satisfies Meta<typeof FormSectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default" fill><FormSectionHeading title="Career journey" /></Cell>
    </CellGrid>
  ),
};
