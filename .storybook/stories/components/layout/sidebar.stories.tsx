import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Sidebar } from "@/components/layout/sidebar";
import { Cell, CellGrid, Frame } from "../../_cell";
import { EXPERT_SIDEBAR_LINKS } from "../../_fixtures";

const meta = {
  component: Sidebar,
  tags: ["ai-generated"],
  args: { links: EXPERT_SIDEBAR_LINKS },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Panel: Story = { args: { variant: "panel" } };

export const WithProfileCompletion: Story = {
  args: { variant: "bare", profileCompletion: 60 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/60/)).toBeVisible();
  },
};

/** Icon rail: labels hidden, titles on hover, completion shrinks to a ring. */
export const Compact: Story = {
  args: { variant: "bare", compact: true, profileCompletion: 45, activeHref: "/dashboard" },
  decorators: [(Story) => <div className="bg-surface-light h-[32rem] w-21 overflow-hidden"><Story /></div>],
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Dashboard active · complete" frame fill>
        <Frame h="h-[26rem] w-72" className="bg-surface-light">
          <Sidebar variant="bare" links={EXPERT_SIDEBAR_LINKS} activeHref="/dashboard" profileCompletion={100} />
        </Frame>
      </Cell>
      <Cell label="Profile active · 45 %" kind="empty" frame fill>
        <Frame h="h-[26rem] w-72" className="bg-surface-light">
          <Sidebar variant="bare" links={EXPERT_SIDEBAR_LINKS} activeHref="/profile" profileCompletion={45} />
        </Frame>
      </Cell>
    </CellGrid>
  ),
};
