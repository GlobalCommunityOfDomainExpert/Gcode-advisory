import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Button } from "@/components/atoms";
import { Dropdown } from "@/components/molecules/dropdown";

const meta = {
  component: Dropdown,
  tags: ["ai-generated"],
  args: {
    trigger: <Button variant="secondary">Actions</Button>,
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ClosedByDefault: Story = {
  args: { items: [{ label: "Edit" }, { label: "Remove" }] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
  },
};

export const ClickOpensMenu: Story = {
  args: { items: [{ label: "Edit" }, { label: "Remove" }] },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /actions/i }));
    await expect(canvas.getByRole("menu")).toBeVisible();
  },
};

export const SelectingItemFiresOnSelectAndCloses: Story = {
  args: {
    items: [{ label: "Edit", onSelect: fn() }, { label: "Remove" }],
  },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /actions/i }));
    const editItem = canvas.getByRole("menuitem", { name: "Edit" });
    await userEvent.click(editItem);
    await expect(args.items[0].onSelect).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
  },
};
