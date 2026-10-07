import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarPlus } from "lucide-react";
import { NextStepStrip } from "@/components/domain/next-step-strip";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: NextStepStrip,
  tags: ["ai-generated"],
  args: { icon: CalendarPlus, title: "Get bookable", text: "Add a service so people can book you.", action: "Add a service" },
} satisfies Meta<typeof NextStepStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Default" fill tint>
        <NextStepStrip icon={CalendarPlus} title="Get bookable" text="Add a service so people can book you." action="Add a service" />
      </Cell>
    </CellGrid>
  ),
};
