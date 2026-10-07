import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Tooltip } from "@/components/atoms/tooltip";

const meta = {
  component: Tooltip,
  tags: ["ai-generated"],
  args: {
    content: "52 spots left",
    children: "Register",
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hidden: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("tooltip")).toHaveClass("opacity-0");
  },
};

export const RevealsOnHover: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByText("Register");
    await userEvent.hover(trigger);
    await expect(canvas.getByRole("tooltip")).toHaveClass("opacity-100");
  },
};

export const BottomPosition: Story = { args: { position: "bottom" } };
