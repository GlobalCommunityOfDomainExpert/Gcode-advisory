import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHero } from "@/components/layout/page-hero";
import { Cell, CellGrid } from "../../_cell";
import { Button } from "@/components/atoms";

const meta = {
  component: PageHero,
  tags: ["ai-generated"],
  args: { title: "Aarav Sharma" },
} satisfies Meta<typeof PageHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="With breadcrumb + action" wide frame fill>
        <PageHero
          bleed={false}
          crumbs={[{ label: "Directory", href: "#" }, { label: "Aarav Sharma" }]}
          title="Aarav Sharma"
          subtitle="Product strategist"
          actions={<Button variant="light">Book a session</Button>}
          paddingBottom="pb-10"
        />
      </Cell>
    </CellGrid>
  ),
};
