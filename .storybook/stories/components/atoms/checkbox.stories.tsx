import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Checkbox } from "@/components/atoms/checkbox";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Checkbox,
  tags: ["ai-generated"],
  args: {
    id: "free-filter",
    label: "Free",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox", { name: /free/i })).toBeChecked();
  },
};

export const Disabled: Story = { args: { disabled: true } };

export const Indeterminate: Story = {
  args: { indeterminate: true },
  play: async ({ canvas }) => {
    const checkbox = canvas.getByRole("checkbox", {
      name: /free/i,
    }) as HTMLInputElement;
    // indeterminate is a DOM property, not reflected as an HTML attribute —
    // proves the component's useEffect actually set it, not just accepted the prop.
    await expect(checkbox.indeterminate).toBe(true);
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Unchecked"><Checkbox label="I agree to the terms" /></Cell>
      <Cell label="Checked" kind="selected"><Checkbox label="I agree to the terms" defaultChecked /></Cell>
      <Cell label="Focus" kind="interactive">
        <span className="contents"><span className="[&_input]:ring-2! [&_input]:ring-primary! [&_input]:ring-offset-2! contents"><Checkbox label="I agree to the terms" /></span></span>
      </Cell>
      <Cell label="Disabled" kind="disabled"><Checkbox label="Not available" disabled /></Cell>
      <Cell label="Disabled · checked" kind="disabled"><Checkbox label="Locked on" defaultChecked disabled /></Cell>
      <Cell label="Long label wraps" kind="variant" fill>
        <Checkbox label="I agree to the Terms & Conditions and the Refund Policy, and I confirm the details above are correct." />
      </Cell>
    </CellGrid>
  ),
};
