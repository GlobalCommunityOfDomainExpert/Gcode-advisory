import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GoogleIcon } from "@/components/atoms/google-icon";
import { Cell, CellGrid } from "../../_cell";
import { Button } from "@/components/atoms/button";

const meta = {
  component: GoogleIcon,
  tags: ["ai-generated"],
  args: {},
} satisfies Meta<typeof GoogleIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="In a button">
        <Button variant="secondary"><GoogleIcon /> Continue with Google</Button>
      </Cell>
    </CellGrid>
  ),
};
