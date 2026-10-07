import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/components/atoms/badge";
import { Cell, CellGrid, Matrix } from "../../_cell";

const meta = {
  component: Badge,
  tags: ["ai-generated"],
  args: {
    children: "Hackathon",
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { tone: "primary" } };
export const Success: Story = { args: { tone: "success" } };
export const Warning: Story = { args: { tone: "warning" } };
export const Danger: Story = { args: { tone: "danger" } };

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Tone × size" kind="variant" wide fill>
        <Matrix
          first="Tone"
          cols={["sm", "md"]}
          rows={["neutral", "primary", "success", "warning", "danger"]}
          cell={(t, s) => (
            <Badge tone={t as "neutral"} size={s as "sm"}>
              {t}
            </Badge>
          )}
        />
      </Cell>
    </CellGrid>
  ),
};
