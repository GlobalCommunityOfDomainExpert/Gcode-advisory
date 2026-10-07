import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileHeader } from "@/components/domain/profile-header";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: ProfileHeader,
  tags: ["ai-generated"],
  args: {
    avatarInitials: "AS",
    name: "Arjun Sharma",
    subtitle: "Senior Corporate Counsel · Bengaluru",
    badges: [{ label: "Legal/CA" }, { label: "Corporate Law" }],
  },
} satisfies Meta<typeof ProfileHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoBadges: Story = { args: { badges: [] } };

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="With badges" fill tint>
        <ProfileHeader
          name="Aarav Sharma"
          avatarSrc="https://randomuser.me/api/portraits/men/75.jpg"
          subtitle="Product strategist · Bengaluru"
          badges={[{ label: "Certified", tone: "success" }, { label: "Paid sessions", tone: "primary" }]}
        />
      </Cell>
      <Cell label="No badges" kind="empty" fill tint>
        <ProfileHeader name="Zed Nobody" subtitle="Fresher · Pune" />
      </Cell>
    </CellGrid>
  ),
};
