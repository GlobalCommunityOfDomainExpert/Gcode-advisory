import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Wordmark } from "@/components/layout/wordmark";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Wordmark,
  tags: ["ai-generated"],
  decorators: [(Story) => <div className="bg-primary p-6"><Story /></div>],
} satisfies Meta<typeof Wordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnNavy: Story = {};
export const Large: Story = { args: { size: "lg" } };

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <CellGrid>
      <Cell label="On navy · md" kind="variant" dark><Wordmark /></Cell>
      <Cell label="On navy · lg" kind="variant" dark><Wordmark size="lg" /></Cell>
      <Cell label="On light" kind="variant"><Wordmark dark /></Cell>
    </CellGrid>
  ),
};
