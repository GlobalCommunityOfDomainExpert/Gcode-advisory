import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Textarea } from "@/components/atoms/textarea";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Textarea,
  tags: ["ai-generated"],
  args: {
    placeholder: "Describe the event…",
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: { error: true },
  play: async ({ canvas }) => {
    const textarea = canvas.getByPlaceholderText(/describe the event/i);
    await expect(textarea).toHaveAttribute("aria-invalid", "true");
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default" fill><Textarea rows={3} placeholder="Tell us about yourself…" /></Cell>
      <Cell label="Hover" kind="interactive" fill><Textarea rows={3} placeholder="Tell us about yourself…" className="border-border-hover!" /></Cell>
      <Cell label="Focus" kind="interactive" fill><Textarea rows={3} placeholder="Tell us about yourself…" className="border-primary! ring-2! ring-primary! ring-offset-2!" /></Cell>
      <Cell label="Filled" fill><Textarea rows={3} defaultValue="Ten years in product strategy across fintech and D2C." /></Cell>
      <Cell label="Disabled" kind="disabled" fill><Textarea rows={3} defaultValue="Not editable" disabled /></Cell>
    </CellGrid>
  ),
};
