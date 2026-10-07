import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ToggleGroup } from "@/components/molecules/toggle-group";
import { Cell, CellGrid } from "../../_cell";
import { Badge } from "@/components/atoms";

const options = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Upcoming" },
];

const meta = {
  component: ToggleGroup,
  tags: ["ai-generated"],
  args: {
    options,
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultValue: "week" },
};

export const ClickChangesActiveOption: Story = {
  args: { defaultValue: "week" },
  play: async ({ canvas, userEvent }) => {
    const weekOption = canvas.getByRole("radio", { name: "This Week" });
    const monthOption = canvas.getByRole("radio", { name: "This Month" });
    await expect(weekOption).toHaveAttribute("aria-checked", "true");

    await userEvent.click(monthOption);

    await expect(monthOption).toHaveAttribute("aria-checked", "true");
    await expect(weekOption).toHaveAttribute("aria-checked", "false");
  },
};

/** Every state, laid out like the wireframe components page. */
const viewAs = [
  { value: "you", label: "You" },
  { value: "visitor", label: "Visitor" },
];

export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="First active" kind="selected"><ToggleGroup options={viewAs} defaultValue="you" ariaLabel="Viewing as" /></Cell>
      <Cell label="Second active" kind="selected"><ToggleGroup options={viewAs} defaultValue="visitor" ariaLabel="Viewing as" /></Cell>
      <Cell label="With counts" kind="variant">
        <ToggleGroup
          defaultValue="all"
          options={[
            { value: "all", label: <>All <Badge tone="primary" size="sm">12</Badge></> },
            { value: "bookable", label: "Bookable" },
            { value: "saved", label: "Saved" },
          ]}
        />
      </Cell>
    </CellGrid>
  ),
};
