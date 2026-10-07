import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Switch } from "@/components/atoms/switch";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Switch,
  tags: ["ai-generated"],
  args: {
    id: "certificate",
    label: "Issue a certificate on completion",
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: { defaultChecked: false },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("switch", {
      name: /issue a certificate/i,
    });
    await expect(input).not.toBeChecked();
  },
};

export const Checked: Story = {
  args: { defaultChecked: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("switch", {
      name: /issue a certificate/i,
    });
    await expect(input).toBeChecked();
  },
};

export const Disabled: Story = { args: { disabled: true } };

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Off"><Switch label="Email alerts" /></Cell>
      <Cell label="On" kind="selected"><Switch label="Email alerts" defaultChecked /></Cell>
      <Cell label="Focus" kind="interactive">
        <span className="contents"><span className="[&_.peer+span]:ring-2! [&_.peer+span]:ring-primary! [&_.peer+span]:ring-offset-2! contents"><Switch label="Email alerts" defaultChecked /></span></span>
      </Cell>
      <Cell label="Disabled · off" kind="disabled"><Switch label="Push alerts" disabled /></Cell>
      <Cell label="Disabled · on" kind="disabled"><Switch label="Push alerts" defaultChecked disabled /></Cell>
    </CellGrid>
  ),
};
