import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PasswordInput } from "@/components/atoms/password-input";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: PasswordInput,
  tags: ["ai-generated"],
  args: { placeholder: "Password" },
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Hidden (default)" fill><PasswordInput defaultValue="secret123" /></Cell>
      <Cell label="Toggle it (live)" kind="interactive" fill note="click the eye → visible"><PasswordInput defaultValue="secret123" /></Cell>
      <Cell label="Error" kind="error" fill><PasswordInput error /></Cell>
    </CellGrid>
  ),
};
