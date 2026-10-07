import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card } from "@/components/atoms/card";
import { Cell, CellGrid } from "../../_cell";

const meta = {
  component: Card,
  tags: ["ai-generated"],
  args: { children: "Card content" },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      {(["sm", "md", "lg"] as const).map((p) => (
        <Cell key={p} label={`Padding ${p}`} kind="variant" fill tint>
          <Card padding={p} className="w-full">
            <p className="text-body text-text-primary">Card content</p>
          </Card>
        </Cell>
      ))}
    </CellGrid>
  ),
};
