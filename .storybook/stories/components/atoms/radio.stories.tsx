import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Radio } from "@/components/atoms/radio";

const meta = {
  component: Radio,
  tags: ["ai-generated"],
  args: {
    name: "price",
    id: "price-free",
    label: "Free",
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("radio", { name: /free/i })).toBeChecked();
  },
};

export const Disabled: Story = { args: { disabled: true } };
