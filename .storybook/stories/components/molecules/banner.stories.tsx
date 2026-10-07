import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Banner } from "@/components/molecules/banner";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Banner,
  tags: ["ai-generated"],
  args: {
    children: "This event has been cancelled by the organizer.",
  },
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { tone: "info" } };
export const Success: Story = { args: { tone: "success" } };
export const Warning: Story = { args: { tone: "warning" } };
export const Danger: Story = { args: { tone: "danger" } };

export const DismissibleFiresCallback: Story = {
  args: { tone: "warning", onDismiss: fn() },
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /dismiss/i }));
    await expect(args.onDismiss).toHaveBeenCalledTimes(1);
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Info" fill><Banner tone="info">Your profile is visible after you publish.</Banner></Cell>
      <Cell label="Success" kind="selected" fill><Banner tone="success">Booking request sent.</Banner></Cell>
      <Cell label="Warning" kind="empty" fill><Banner tone="warning">Paid services stay paused without a payout account.</Banner></Cell>
      <Cell label="Danger" kind="error" fill><Banner tone="danger">Payment failed. Try another method.</Banner></Cell>
    </CellGrid>
  ),
};
