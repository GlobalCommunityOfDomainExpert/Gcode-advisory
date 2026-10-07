import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Breadcrumb } from "@/components/molecules/breadcrumb";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Breadcrumb,
  tags: ["ai-generated"],
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: "Organizing", href: "/my-organized-events" },
      { label: "GCODE Build Sprint · Summer 2026" },
    ],
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: /organizing/i }),
    ).toHaveAttribute("href", "/my-organized-events");
    await expect(
      canvas.getByText("GCODE Build Sprint · Summer 2026"),
    ).toHaveAttribute("aria-current", "page");
  },
};

export const SingleLevel: Story = {
  args: { items: [{ label: "Events" }] },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  args: { items: [] },
  render: () => (
    <CellGrid>
      <Cell label="Three levels" fill>
        <Breadcrumb items={[{ label: "Directory", href: "#" }, { label: "Experts", href: "#" }, { label: "Aarav Sharma" }]} />
      </Cell>
      <Cell label="Two levels" kind="variant" fill>
        <Breadcrumb items={[{ label: "Dashboard", href: "#" }, { label: "Bookings" }]} />
      </Cell>
      <Cell label="On navy (dark)" kind="variant" fill dark>
        <Breadcrumb dark items={[{ label: "Directory", href: "#" }, { label: "Aarav Sharma" }]} />
      </Cell>
      <Cell label="Long label truncates" kind="variant">
        <div className="w-56">
          <Breadcrumb items={[{ label: "Directory", href: "#" }, { label: "A very long person or company name that cannot fit" }]} />
        </div>
      </Cell>
    </CellGrid>
  ),
};
