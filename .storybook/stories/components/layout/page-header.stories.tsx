import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHeader, BackLink } from "@/components/layout/page-header";
import { Cell, CellGrid } from "../../_cell";
import { Button, Input, Avatar } from "@/components/atoms";
import { Search } from "lucide-react";

const meta = {
  component: PageHeader,
  tags: ["ai-generated"],
  args: { title: "Bookings" },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Eyebrow + actions" wide fill tint>
        <PageHeader eyebrow="Workspace" title="Bookings" subtitle="Requests, sessions and history." actions={<Button>Find an expert</Button>} />
      </Cell>
      <Cell label="Back link (focused flow)" fill tint>
        <PageHeader back={<BackLink href="#">Back to directory</BackLink>} title="Book a session" subtitle="Choose a service, date and time." />
      </Cell>
      <Cell label="Lead avatar + extra" kind="variant" fill tint>
        <PageHeader
          lead={<Avatar alt="Aarav Sharma" src="https://randomuser.me/api/portraits/men/75.jpg" size="lg" />}
          title="Aarav Sharma"
          subtitle="Product strategist"
          extra={<Input icon={Search} placeholder="Search" />}
        />
      </Cell>
    </CellGrid>
  ),
};
