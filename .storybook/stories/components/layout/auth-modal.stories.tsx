import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuthModal } from "@/components/layout/auth-modal";
import { Cell, CellGrid, Frame } from "../../_cell";
import { Button, Input } from "@/components/atoms";
import { FormField } from "@/components/molecules/form-field";

const meta = {
  component: AuthModal,
  tags: ["ai-generated"],
  args: { title: "Welcome back", subtitle: "Sign in to continue", children: null, onClose: () => {} },
} satisfies Meta<typeof AuthModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Sign in" wide frame fill>
        <Frame h="h-[34rem]">
          <AuthModal inline onClose={() => {}} title="Welcome back" subtitle="Sign in to continue">
            <FormField label="Email" htmlFor="cg-am">
              <Input id="cg-am" placeholder="you@company.com" />
            </FormField>
            <Button className="w-full">Continue</Button>
          </AuthModal>
        </Frame>
      </Cell>
    </CellGrid>
  ),
};
