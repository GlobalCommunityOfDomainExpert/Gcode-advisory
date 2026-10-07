import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Input } from "@/components/atoms";
import { FormField } from "@/components/molecules/form-field";
import { Cell, CellGrid } from "../../_cell";
import { Select, Textarea } from "@/components/atoms";

const meta = {
  component: FormField,
  tags: ["ai-generated"],
  args: {
    label: "Event Title",
    htmlFor: "event-title",
    children: <Input id="event-title" placeholder="e.g. GCODE Build Sprint" />,
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHint: Story = {
  args: { hint: "This shows up on the event's public page." },
};

export const WithError: Story = {
  args: { error: "Title is required." },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Title is required.")).toBeVisible();
  },
};

export const Required: Story = {
  args: { required: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("*")).toBeVisible();
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default" fill>
        <FormField label="Company" htmlFor="cg-f1"><Input id="cg-f1" placeholder="Acme Ltd" /></FormField>
      </Cell>
      <Cell label="Required + hint" kind="variant" fill>
        <FormField label="Email" htmlFor="cg-f2" required hint="We never share it."><Input id="cg-f2" placeholder="you@company.com" /></FormField>
      </Cell>
      <Cell label="Error" kind="error" fill>
        <FormField label="Email" htmlFor="cg-f3" required error="Enter a valid email address."><Input id="cg-f3" defaultValue="aarav@" error /></FormField>
      </Cell>
      <Cell label="Disabled" kind="disabled" fill>
        <FormField label="Role" htmlFor="cg-f4" hint="Set at sign-up."><Input id="cg-f4" defaultValue="Domain Expert" disabled /></FormField>
      </Cell>
      <Cell label="With select" kind="variant" fill>
        <FormField label="Timezone" htmlFor="cg-f5"><Select id="cg-f5" defaultValue="India (IST)"><option>India (IST)</option></Select></FormField>
      </Cell>
      <Cell label="With textarea" kind="variant" fill>
        <FormField label="Bio" htmlFor="cg-f6" hint="0 / 400"><Textarea id="cg-f6" rows={2} /></FormField>
      </Cell>
    </CellGrid>
  ),
};
