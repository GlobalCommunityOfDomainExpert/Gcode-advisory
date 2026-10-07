import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { CheckoutSummary } from "@/components/domain/checkout-summary";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: CheckoutSummary,
  tags: ["ai-generated"],
  args: {
    items: [
      { label: "Ticket price", value: "₹299" },
      { label: "Platform fee", value: "₹0" },
    ],
    total: "₹299",
    onAction: fn(),
  },
} satisfies Meta<typeof CheckoutSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Processing: Story = {
  args: { processing: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: /register/i }),
    ).toBeDisabled();
  },
};

export const ActionFiresCallback: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: /register/i }));
    await expect(args.onAction).toHaveBeenCalledTimes(1);
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Paid session" fill tint>
        <CheckoutSummary
          items={[
            { label: "Product strategy session", sub: "30 min · Tue 29 Sep, 10:00", value: "₹1,200" },
            { label: "Platform fee", value: "₹0" },
          ]}
          total="₹1,200"
          actionLabel="Pay ₹1,200"
        />
      </Cell>
      <Cell label="Free session" kind="variant" fill tint>
        <CheckoutSummary items={[{ label: "Intro call", sub: "15 min", value: "FREE" }]} total="FREE" actionLabel="Send request" />
      </Cell>
    </CellGrid>
  ),
};
