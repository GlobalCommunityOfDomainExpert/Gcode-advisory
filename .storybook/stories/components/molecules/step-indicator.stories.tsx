import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StepIndicator } from "@/components/molecules/step-indicator";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: StepIndicator,
  tags: ["ai-generated"],
} satisfies Meta<typeof StepIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {
  args: {
    steps: [
      { label: "Type", status: "completed" },
      { label: "Details", status: "completed" },
      { label: "Schedule & Mode", status: "current" },
      { label: "Agenda & Media", status: "upcoming" },
      { label: "Review", status: "upcoming" },
    ],
  },
};

export const AllUpcoming: Story = {
  args: {
    steps: [
      { label: "Type", status: "current" },
      { label: "Details", status: "upcoming" },
      { label: "Review", status: "upcoming" },
    ],
  },
};

export const AllCompleted: Story = {
  args: {
    steps: [
      { label: "Type", status: "completed" },
      { label: "Details", status: "completed" },
      { label: "Review", status: "completed" },
    ],
  },
};

/** Every state, laid out like the wireframe components page. */
const labels = ["Service", "Date", "Review", "Pay"];
const steps = (s: ("completed" | "current" | "upcoming")[]) => labels.map((label, i) => ({ label, status: s[i] }));

export const States: Story = {
  args: { steps: [] },
  render: () => (
    <CellGrid>
      <Cell label="Step 1 current" fill><StepIndicator steps={steps(["current", "upcoming", "upcoming", "upcoming"])} /></Cell>
      <Cell label="Step 3 current" kind="selected" fill><StepIndicator steps={steps(["completed", "completed", "current", "upcoming"])} /></Cell>
      <Cell label="All complete" kind="selected" fill><StepIndicator steps={steps(["completed", "completed", "completed", "completed"])} /></Cell>
    </CellGrid>
  ),
};
