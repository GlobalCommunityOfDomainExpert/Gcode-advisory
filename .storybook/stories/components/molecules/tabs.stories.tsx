import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Tabs } from "@/components/molecules/tabs";
import { Cell, CellGrid } from "../../_cell";
import { Badge } from "@/components/atoms";

const items = [
  { value: "all", label: "All" },
  { value: "webinars", label: "Webinars" },
  { value: "hackathons", label: "Hackathons" },
];

const meta = {
  component: Tabs,
  tags: ["ai-generated"],
  args: {
    items,
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultValue: "all" },
};

export const ClickChangesActiveTab: Story = {
  args: { defaultValue: "all" },
  play: async ({ canvas, userEvent }) => {
    const allTab = canvas.getByRole("tab", { name: "All" });
    const webinarsTab = canvas.getByRole("tab", { name: "Webinars" });
    await expect(allTab).toHaveAttribute("aria-selected", "true");
    await expect(webinarsTab).toHaveAttribute("aria-selected", "false");

    await userEvent.click(webinarsTab);

    await expect(webinarsTab).toHaveAttribute("aria-selected", "true");
    await expect(allTab).toHaveAttribute("aria-selected", "false");
  },
};

/** Every state, laid out like the wireframe components page. */
const basic = [
  { value: "basic", label: "Basic info" },
  { value: "journey", label: "Journey" },
  { value: "expertise", label: "Expertise" },
  { value: "services", label: "Services" },
];

export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="First active" kind="selected" fill><Tabs items={basic} defaultValue="basic" /></Cell>
      <Cell label="Third active" kind="selected" fill><Tabs items={basic} defaultValue="expertise" /></Cell>
      <Cell label="With count badges" kind="variant" fill>
        <Tabs
          defaultValue="up"
          items={[
            { value: "up", label: <>Upcoming <Badge tone="primary" size="sm">3</Badge></> },
            { value: "done", label: "Completed" },
            { value: "x", label: <>Cancelled <Badge tone="danger" size="sm">1</Badge></> },
          ]}
        />
      </Cell>
      <Cell label="Overflow (narrow)" kind="variant" note="scrolls sideways">
        <div className="w-64">
          <Tabs items={[...basic, { value: "about", label: "About" }]} defaultValue="basic" />
        </div>
      </Cell>
    </CellGrid>
  ),
};
