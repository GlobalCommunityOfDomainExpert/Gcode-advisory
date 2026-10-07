import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Avatar } from "@/components/atoms/avatar";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Avatar,
  tags: ["ai-generated"],
  args: {
    alt: "Arjun Sharma",
    initials: "AS",
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const Large: Story = { args: { size: "lg" } };
export const OnlineStatus: Story = {
  args: { status: "online" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("img", { name: /online/i })).toBeVisible();
  },
};

/** Every state, laid out like the wireframe components page. */
const PHOTO = "https://randomuser.me/api/portraits/men/75.jpg";

export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Size sm · 32" kind="variant"><Avatar alt="Aarav Sharma" src={PHOTO} size="sm" /></Cell>
      <Cell label="Size md · 40" kind="variant"><Avatar alt="Aarav Sharma" src={PHOTO} size="md" /></Cell>
      <Cell label="Size lg · 48" kind="variant"><Avatar alt="Aarav Sharma" src={PHOTO} size="lg" /></Cell>
      <Cell label="Size xl + upload" kind="variant"><Avatar alt="Aarav Sharma" src={PHOTO} size="xl" onUpload={() => {}} /></Cell>
      <Cell label="Initials fallback" kind="empty" note="no photo on file"><Avatar alt="Zed Nobody" size="lg" /></Cell>
    </CellGrid>
  ),
};
