import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { NotifMenu } from "@/components/layout/notif-menu";
import { Cell, CellGrid, Frame } from "../../_cell";
import { EXPERT_NOTIFICATIONS } from "../../_fixtures";

const meta = {
  component: NotifMenu,
  tags: ["ai-generated"],
  args: { items: EXPERT_NOTIFICATIONS },
  decorators: [(Story) => <div className="bg-primary flex justify-end p-4"><Story /></div>],
} satisfies Meta<typeof NotifMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = {};
export const AllRead: Story = { args: { allRead: true } };

export const OpensAndMarksRead: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /notifications, 2 unread/i }));
    await userEvent.click(canvas.getByRole("button", { name: /mark all as read/i }));
    await expect(canvas.getByRole("button", { name: "Notifications" })).toBeVisible();
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <CellGrid>
      <Cell label="Unread badge" fill note="click to open">
        <div className="bg-primary -m-4 flex w-full justify-end p-4">
          <NotifMenu items={EXPERT_NOTIFICATIONS} />
        </div>
      </Cell>
      <Cell label="All read" kind="empty" fill>
        <div className="bg-primary -m-4 flex w-full justify-end p-4">
          <NotifMenu items={EXPERT_NOTIFICATIONS} allRead />
        </div>
      </Cell>
      <Cell label="Open" kind="selected" wide frame fill>
        <Frame h="h-[26rem]">
          <div className="bg-primary flex h-16 items-center justify-end px-4">
            <NotifMenu items={EXPERT_NOTIFICATIONS} defaultOpen />
          </div>
        </Frame>
      </Cell>
    </CellGrid>
  ),
};
