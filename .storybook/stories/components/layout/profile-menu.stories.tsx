import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { Cell, CellGrid, Frame } from "../../_cell";
import { AARAV, AARAV_EMAIL } from "../../_fixtures";

const meta = {
  component: ProfileMenu,
  tags: ["ai-generated"],
  args: { user: AARAV, email: AARAV_EMAIL },
  decorators: [(Story) => <div className="bg-primary flex justify-end p-4 pb-72"><Story /></div>],
} satisfies Meta<typeof ProfileMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OpensMenu: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /aarav sharma/i }));
    // the menu fades in, so wait for it to become visible
    await waitFor(() => expect(canvas.getByRole("menuitem", { name: /account settings/i })).toBeVisible());
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  decorators: [(Story) => <Story />],
  render: () => (
    <CellGrid>
      <Cell label="Closed" fill note="click to open">
        <div className="bg-primary -m-4 flex w-full justify-end p-4">
          <ProfileMenu user={AARAV} email={AARAV_EMAIL} />
        </div>
      </Cell>
      <Cell label="Open" kind="selected" frame fill>
        <Frame h="h-72">
          <div className="bg-primary flex h-16 items-center justify-end px-4">
            <ProfileMenu user={AARAV} email={AARAV_EMAIL} defaultOpen />
          </div>
        </Frame>
      </Cell>
    </CellGrid>
  ),
};
