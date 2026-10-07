import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "@/components/atoms/skeleton";

const meta = {
  component: Skeleton,
  tags: ["ai-generated"],
  args: {
    className: "h-4 w-40",
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { className: "h-6 w-40 rounded-sm" } };
