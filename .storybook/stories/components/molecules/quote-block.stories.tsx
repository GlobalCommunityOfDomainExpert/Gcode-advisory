import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QuoteBlock } from "@/components/molecules/quote-block";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: QuoteBlock,
  tags: ["ai-generated"],
  args: {
    children: "A B2B SaaS platform for sustainable packaging supply chains.",
  },
} satisfies Meta<typeof QuoteBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default" fill><QuoteBlock>I help early-stage teams find the one metric worth obsessing over.</QuoteBlock></Cell>
    </CellGrid>
  ),
};
