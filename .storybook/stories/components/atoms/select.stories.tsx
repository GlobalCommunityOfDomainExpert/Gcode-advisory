import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Select } from "@/components/atoms/select";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Select,
  tags: ["ai-generated"],
  args: {
    "aria-label": "Event mode",
    children: (
      <>
        <option value="online">Online</option>
        <option value="in-person">In-Person</option>
        <option value="hybrid">Hybrid</option>
      </>
    ),
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithError: Story = { args: { error: true } };
export const Disabled: Story = { args: { disabled: true } };

export const SelectingChangesValue: Story = {
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByRole("combobox", {
      name: /event mode/i,
    }) as HTMLSelectElement;
    await userEvent.selectOptions(select, "hybrid");
    await expect(select).toHaveValue("hybrid");
  },
};

/** Every state, laid out like the wireframe components page. */
const opts = (
  <>
    <option value="" disabled>Choose a domain</option>
    <option>Marketing</option>
    <option>Finance</option>
  </>
);

export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Placeholder" fill><Select aria-label="Domain" defaultValue="">{opts}</Select></Cell>
      <Cell label="Hover" kind="interactive" fill><Select aria-label="Domain" defaultValue="" className="border-border-hover!">{opts}</Select></Cell>
      <Cell label="Focus" kind="interactive" fill><Select aria-label="Domain" defaultValue="" className="border-primary! ring-2! ring-primary! ring-offset-2!">{opts}</Select></Cell>
      <Cell label="Selected" kind="selected" fill><Select aria-label="Domain" defaultValue="Finance">{opts}</Select></Cell>
      <Cell label="Error" kind="error" fill><Select aria-label="Domain" defaultValue="" error>{opts}</Select></Cell>
      <Cell label="Disabled" kind="disabled" fill><Select aria-label="Domain" defaultValue="Marketing" disabled>{opts}</Select></Cell>
    </CellGrid>
  ),
};
