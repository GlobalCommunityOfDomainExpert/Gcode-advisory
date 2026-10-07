import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Pagination } from "@/components/molecules/pagination";

const meta = {
  component: Pagination,
  tags: ["ai-generated"],
  args: {
    totalPages: 10,
    onPageChange: fn(),
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MiddlePage: Story = {
  args: { page: 5 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "5" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
};

export const FirstPage: Story = {
  args: { page: 1 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: /previous page/i }),
    ).toBeDisabled();
  },
};

export const LastPage: Story = {
  args: { page: 10 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: /next page/i }),
    ).toBeDisabled();
  },
};

export const ClickPageFiresOnPageChange: Story = {
  args: { page: 5 },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /next page/i }));
    await expect(args.onPageChange).toHaveBeenCalledWith(6);
  },
};
