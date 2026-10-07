import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ChecklistItem } from "@/components/molecules/checklist-item";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: ChecklistItem,
  tags: ["ai-generated"],
  args: {
    label: "Add event description",
  },
} satisfies Meta<typeof ChecklistItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Incomplete: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("checkbox", { name: /add event description/i }),
    ).not.toBeChecked();
  },
};

export const Completed: Story = {
  args: { completed: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("checkbox", { name: /add event description/i }),
    ).toBeChecked();
  },
};

export const WithSubtext: Story = {
  args: { subtext: "At least 2 sentences recommended" },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="To do" fill><ChecklistItem label="Add your journey" subtext="Career and education" onClick={() => {}} /></Cell>
      <Cell label="Done" kind="selected" fill><ChecklistItem label="Basic info" subtext="All fields filled" completed onClick={() => {}} /></Cell>
      <Cell label="Focus" kind="interactive" fill>
        <span className="contents"><span className="[&>button]:ring-2! [&>button]:ring-primary! [&>button]:ring-offset-2! contents"><ChecklistItem label="Add your journey" subtext="Career and education" onClick={() => {}} /></span></span>
      </Cell>
    </CellGrid>
  ),
};
