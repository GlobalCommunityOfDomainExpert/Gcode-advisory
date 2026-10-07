import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Spinner } from "@/components/atoms/spinner";

const meta = {
  component: Spinner,
  tags: ["ai-generated"],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Circle: Story = {
  args: { variant: "circle" },
  play: async ({ canvas }) => {
    // role="status" has no ARIA "name from content" — the sr-only text is a
    // live-region announcement, not an accessible name, so assert separately.
    await expect(canvas.getByRole("status")).toBeVisible();
    await expect(canvas.getByText(/loading/i)).toBeInTheDocument();
  },
};

export const Dots: Story = { args: { variant: "dots" } };
export const Large: Story = { args: { size: "lg" } };
