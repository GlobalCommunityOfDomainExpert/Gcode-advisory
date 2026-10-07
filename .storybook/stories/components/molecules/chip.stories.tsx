import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Chip } from "@/components/molecules/chip";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Chip,
  tags: ["ai-generated"],
  args: {
    children: "Free",
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {
  args: { selected: false },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole("checkbox", { name: /free/i });
    await expect(chip).toHaveAttribute("aria-checked", "false");
  },
};

export const Selected: Story = {
  args: { selected: true },
  play: async ({ canvas }) => {
    const chip = canvas.getByRole("checkbox", { name: /free/i });
    await expect(chip).toHaveAttribute("aria-checked", "true");
  },
};

export const Disabled: Story = { args: { disabled: true } };

export const ClickFiresOnClick: Story = {
  args: { selected: false, onClick: fn() },
  play: async ({ canvas, userEvent, args }) => {
    const chip = canvas.getByRole("checkbox", { name: /free/i });
    await userEvent.click(chip);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Unselected"><Chip>Marketing</Chip></Cell>
      <Cell label="Hover" kind="interactive"><span className="contents"><span className="[&>button]:bg-bg-light! contents"><Chip>Marketing</Chip></span></span></Cell>
      <Cell label="Focus" kind="interactive"><span className="contents"><span className="[&>button]:ring-2! [&>button]:ring-primary! [&>button]:ring-offset-2! contents"><Chip>Marketing</Chip></span></span></Cell>
      <Cell label="Selected" kind="selected"><Chip selected>Marketing</Chip></Cell>
      <Cell label="Group" kind="variant">
        {["Marketing", "Finance", "Design", "Legal"].map((t, i) => (
          <Chip key={t} selected={i === 1 || i === 2}>{t}</Chip>
        ))}
      </Cell>
      <Cell label="Disabled" kind="disabled"><Chip disabled>Marketing</Chip></Cell>
    </CellGrid>
  ),
};
