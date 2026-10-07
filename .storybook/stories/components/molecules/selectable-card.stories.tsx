import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Hammer } from "lucide-react";
import { expect, fn } from "storybook/test";
import { SelectableCard } from "@/components/molecules/selectable-card";
import { Cell, CellGrid } from "../../_cell";
import { Briefcase } from "lucide-react";

const meta = {
  component: SelectableCard,
  tags: ["ai-generated"],
  args: {
    icon: Hammer,
    title: "Hackathon",
    subtitle: "Build sprint, team-based",
    onSelect: fn(),
  },
} satisfies Meta<typeof SelectableCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = { args: { selected: false } };
export const Selected: Story = { args: { selected: true } };

export const ClickFiresOnSelect: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("radio", { name: /hackathon/i }));
    await expect(args.onSelect).toHaveBeenCalledTimes(1);
  },
};

const card = { icon: Briefcase, title: "Domain Expert", subtitle: "Offer paid sessions" };

export const Disabled: Story = { args: { disabled: true } };

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Unselected" fill><SelectableCard {...card} /></Cell>
      <Cell label="Hover" kind="interactive" fill><span className="contents"><span className="[&>button]:border-border-hover! contents"><SelectableCard {...card} /></span></span></Cell>
      <Cell label="Focus" kind="interactive" fill><span className="contents"><span className="[&>button]:ring-2! [&>button]:ring-primary! [&>button]:ring-offset-2! contents"><SelectableCard {...card} /></span></span></Cell>
      <Cell label="Selected" kind="selected" fill><SelectableCard {...card} selected /></Cell>
    </CellGrid>
  ),
};
