import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";
import { Modal } from "@/components/molecules/modal";

const meta = {
  component: Modal,
  tags: ["ai-generated"],
  args: {
    open: true,
    title: "Cancel this event?",
    onClose: fn(),
    children: "This can't be undone.",
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  play: async ({ canvasElement }) => {
    // Modal portals to document.body, outside the story's own canvas root.
    const body = within(canvasElement.ownerDocument.body);
    await expect(
      body.getByRole("dialog", { name: /cancel this event/i }),
    ).toBeVisible();
  },
};

export const Closed: Story = {
  args: { open: false },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.queryByRole("dialog")).not.toBeInTheDocument();
  },
};

export const CloseButtonFiresOnClose: Story = {
  play: async ({ canvasElement, args, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    const closeButton = await body.findByRole("button", { name: /close/i });
    await userEvent.click(closeButton);
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};
