import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TagPill, TagList } from "@/components/molecules/tag-pill";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: TagPill,
  tags: ["ai-generated"],
  args: { children: "Pricing" },
} satisfies Meta<typeof TagPill>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Single"><TagPill>Pricing</TagPill></Cell>
      <Cell label="List" kind="variant" fill><TagList items={["Pricing", "Go-to-market", "Onboarding", "Retention", "B2B SaaS"]} /></Cell>
    </CellGrid>
  ),
};
