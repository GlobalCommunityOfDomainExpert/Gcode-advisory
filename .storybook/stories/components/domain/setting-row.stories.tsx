import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SettingGroup, ValueLine } from "@/components/domain/setting-row";
import { Cell, CellGrid } from "../../_cell";
import { Button, Switch } from "@/components/atoms";

const meta = {
  component: SettingGroup,
  tags: ["ai-generated"],
  args: { title: "Email", children: null },
} satisfies Meta<typeof SettingGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Group with value line" wide fill>
        <SettingGroup title="Email" description="Used to sign in.">
          <ValueLine text="aarav@example.com" sub="Verified" action={<Button variant="secondary" size="sm">Change</Button>} />
        </SettingGroup>
      </Cell>
      <Cell label="Group with switches" kind="variant" wide fill>
        <SettingGroup title="Notifications" description="Pick channels.">
          <Switch label="Email" defaultChecked />
          <Switch label="Push" />
        </SettingGroup>
      </Cell>
    </CellGrid>
  ),
};
