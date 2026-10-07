import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Input } from "@/components/atoms/input";
import { Cell, CellGrid } from "../../_cell";
import { Search } from "lucide-react";

const meta = {
  component: Input,
  tags: ["ai-generated"],
  args: {
    placeholder: "Enter event title…",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  args: { error: true },
  play: async ({ canvas }) => {
    const input = canvas.getByPlaceholderText(/enter event title/i);
    await expect(input).toHaveAttribute("aria-invalid", "true");
  },
};

export const Disabled: Story = { args: { disabled: true } };

export const TypingUpdatesValue: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByPlaceholderText(/enter event title/i);
    await userEvent.type(input, "GCODE Build Sprint");
    await expect(input).toHaveValue("GCODE Build Sprint");
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default" fill><Input placeholder="you@company.com" /></Cell>
      <Cell label="Hover" kind="interactive" fill><Input placeholder="you@company.com" className="border-border-hover!" /></Cell>
      <Cell label="Focus" kind="interactive" fill><Input placeholder="you@company.com" className="border-primary! ring-2! ring-primary! ring-offset-2!" /></Cell>
      <Cell label="Filled" fill><Input defaultValue="aarav@example.com" /></Cell>
      <Cell label="Error" kind="error" fill><Input defaultValue="aarav@" error /></Cell>
      <Cell label="Disabled" kind="disabled" fill><Input defaultValue="Locked value" disabled /></Cell>
      <Cell label="With icon" kind="variant" fill><Input icon={Search} placeholder="Search experts" /></Cell>
      <Cell label="Size sm · 36" kind="variant" fill><Input size="sm" placeholder="Small" /></Cell>
      <Cell label="Size lg · 48" kind="variant" fill><Input size="lg" placeholder="Large" /></Cell>
    </CellGrid>
  ),
};
