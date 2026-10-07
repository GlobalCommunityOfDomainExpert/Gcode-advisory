import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Timeline } from "@/components/molecules/timeline";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Timeline,
  tags: ["ai-generated"],
  args: {
    items: [
      {
        title: "10:00 AM — Kickoff & Problem Statement",
        description: "Opening session, team registration, problem brief",
        past: true,
      },
      {
        title: "12:00 PM — Expert Office Hours",
        description: "30-min live Q&A with domain experts",
        active: true,
      },
      {
        title: "5:00 PM — Winners Announced",
        description: "Live judging + prize distribution",
      },
    ],
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Three items" fill>
        <Timeline
          items={[
            { time: "2022 – now", title: "Head of Product", sub: "Brightpath", description: "Led pricing and onboarding.", active: true },
            { time: "2019 – 2022", title: "Product Manager", sub: "PaySprint" },
            { time: "2015 – 2019", title: "B.Tech", sub: "RVCE" },
          ]}
        />
      </Cell>
      <Cell label="Single item" kind="variant" fill>
        <Timeline items={[{ time: "2024", title: "Founder", sub: "GreenLoop", active: true }]} />
      </Cell>
    </CellGrid>
  ),
};
