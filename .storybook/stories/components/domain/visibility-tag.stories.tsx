import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VisibilityTag } from "@/components/domain/visibility-tag";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: VisibilityTag,
  tags: ["ai-generated"],
  args: { type: "public" },
} satisfies Meta<typeof VisibilityTag>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      {(["public", "contact", "private"] as const).map((t) => (
        <Cell key={t} label={t} kind="variant"><VisibilityTag type={t} /></Cell>
      ))}
    </CellGrid>
  ),
};
