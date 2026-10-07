import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Footer } from "@/components/layout/footer";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Footer,
  tags: ["ai-generated"],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default" frame fill wide>
        <Footer className="mt-0" />
      </Cell>
    </CellGrid>
  ),
};
