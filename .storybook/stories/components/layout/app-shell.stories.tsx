import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { AppShell } from "@/components/layout/app-shell";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Cell, CellGrid } from "../../_cell";
import { EXPERT_SIDEBAR_LINKS } from "../../_fixtures";

const meta = {
  component: AppShell,
  tags: ["ai-generated"],
  args: {
    navbar: <Navbar />,
    sidebar: <Sidebar variant="bare" links={EXPERT_SIDEBAR_LINKS} />,
    children: <p>Page content</p>,
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Page content")).toBeVisible();
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Anatomy" kind="variant" wide fill>
        <div className="border-border-hover text-small w-full overflow-hidden rounded-md border">
          <div className="bg-primary px-3 py-2 text-white">
            <b>Navbar</b> · wordmark · directory · bell · account menu · hamburger (&lt; lg)
          </div>
          <div className="flex h-56">
            <aside className="bg-surface-light border-border-light text-text-secondary w-40 shrink-0 border-r p-3">
              <b className="text-text-primary">Sidebar</b>
              <br />
              Workspace
              <br />
              Account
              <br />
              <span className="bg-bg-subtle mt-2 block rounded-sm p-1">Completion card</span>
              <span className="mt-2 block italic">lg and up</span>
            </aside>
            <main className="bg-page text-text-secondary flex-1 space-y-2 p-3">
              <b className="text-text-primary">Main (scrolls)</b>
              <div className="bg-surface-light rounded-sm p-2">Page header</div>
              <div className="bg-surface-light rounded-sm p-2">Cards / content</div>
              <div className="bg-surface-light rounded-sm p-2">Footer</div>
            </main>
          </div>
        </div>
      </Cell>
    </CellGrid>
  ),
};
