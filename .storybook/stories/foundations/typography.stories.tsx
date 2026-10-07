import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SectionLabel } from "@/components/atoms";
import { Cell, CellGrid } from "../_cell";

const meta = {
  title: "Foundations/Type scale",
  tags: ["ai-generated"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inter. 1rem = 14.4px on auth pages, 13.1px inside the signed-in app. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="display · 36" kind="variant"><p className="text-display text-text-primary font-extrabold tracking-tight">Display</p></Cell>
      <Cell label="heading · 24" kind="variant"><p className="text-heading text-text-primary font-extrabold">Heading</p></Cell>
      <Cell label="large · 18" kind="variant"><p className="text-large text-text-primary font-semibold">Large title</p></Cell>
      <Cell label="body · 16" kind="variant"><p className="text-body text-text-primary">Body copy reads at this size.</p></Cell>
      <Cell label="small · 14" kind="variant"><p className="text-small text-text-secondary">Small — hints, captions, meta.</p></Cell>
      <Cell label="Section label" kind="variant"><SectionLabel>Uppercase tracked</SectionLabel></Cell>
    </CellGrid>
  ),
};
