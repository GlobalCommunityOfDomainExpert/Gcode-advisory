import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Progress } from "@/components/atoms/progress";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Progress,
  tags: ["ai-generated"],
  args: {
    value: 40,
    max: 100,
    label: "Registration capacity",
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const bar = canvas.getByRole("progressbar", {
      name: /registration capacity/i,
    });
    await expect(bar).toHaveAttribute("aria-valuenow", "40");
  },
};

export const Success: Story = { args: { tone: "success", value: 90 } };
export const Danger: Story = { args: { tone: "danger", value: 95 } };

export const ClampsAboveMax: Story = {
  args: { value: 150 },
  play: async ({ canvas }) => {
    // 150 > max(100) — value.now is passed through raw, but the fill width must clamp visually.
    const bar = canvas.getByRole("progressbar", {
      name: /registration capacity/i,
    });
    const fill = bar.firstElementChild as HTMLElement;
    await expect(fill.style.width).toBe("100%");
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="0 %" kind="empty" fill><Progress value={0} /></Cell>
      <Cell label="35 % · primary" fill><Progress value={35} /></Cell>
      <Cell label="60 % · secondary" kind="variant" fill><Progress value={60} tone="secondary" /></Cell>
      <Cell label="100 % · success" kind="selected" fill><Progress value={100} tone="success" /></Cell>
    </CellGrid>
  ),
};
