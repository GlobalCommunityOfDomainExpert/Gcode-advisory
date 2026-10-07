import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Link } from "@/components/atoms/link";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Link,
  tags: ["ai-generated"],
  args: {
    href: "#",
    children: "View Terms & Conditions",
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default"><Link href="#">Forgot password?</Link></Cell>
      <Cell label="Hover" kind="interactive"><Link href="#" className="underline!">Forgot password?</Link></Cell>
      <Cell label="Focus" kind="interactive"><Link href="#" className="ring-2! ring-primary! ring-offset-2!">Forgot password?</Link></Cell>
    </CellGrid>
  ),
};
