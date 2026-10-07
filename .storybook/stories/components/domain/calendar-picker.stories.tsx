import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CalendarPicker } from "@/components/domain/calendar-picker";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: CalendarPicker,
  tags: ["ai-generated"],
  args: { year: 2026, month: 8, isAvailable: (d: Date) => d.getDate() < 0 },
} satisfies Meta<typeof CalendarPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
const AVAILABLE = [28, 30]; // days of Sep 2026 that have open slots

export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="No date chosen" fill tint>
        <CalendarPicker year={2026} month={8} isAvailable={(d) => AVAILABLE.includes(d.getDate())} />
      </Cell>
      <Cell label="Date selected" kind="selected" fill tint>
        <CalendarPicker year={2026} month={8} selectedKey="2026-09-28" isAvailable={(d) => AVAILABLE.includes(d.getDate())} />
      </Cell>
    </CellGrid>
  ),
};

export const WithDaysOff: Story = {
  args: { year: 2026, month: 9, isAvailable: (d) => [5, 7, 8, 12].includes(d.getDate()), isDayOff: (d) => d.getDate() === 1 },
};
