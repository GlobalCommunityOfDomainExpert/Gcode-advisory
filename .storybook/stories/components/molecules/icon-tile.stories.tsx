import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Star } from "lucide-react";
import { IconTile } from "@/components/molecules/icon-tile";
import { Cell, CellGrid, Matrix } from "../../_cell";
import type { IconTileTone, IconTileSize } from "@/components/molecules/icon-tile";

const meta = {
  component: IconTile,
  tags: ["ai-generated"],
  args: { icon: Star },
} satisfies Meta<typeof IconTile>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Tone × size" kind="variant" wide fill>
        <Matrix
          first="Tone"
          cols={["md", "lg"]}
          rows={["primary", "solid", "success", "warning", "danger", "neutral"]}
          cell={(t, s) => <IconTile icon={Star} tone={t as IconTileTone} size={s as IconTileSize} />}
        />
      </Cell>
    </CellGrid>
  ),
};
