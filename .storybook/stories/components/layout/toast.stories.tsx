import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Toast } from "@/components/layout/toast";
import { Cell, CellGrid } from "../../_cell";
import { useState } from "react";
import { Button } from "@/components/atoms";

const meta = {
  component: Toast,
  tags: ["ai-generated"],
  args: { message: "Booking request sent. You’ll hear back within 24 hours." },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every state, laid out like the wireframe components page. */
function ToastTrigger() {
  const [show, setShow] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setShow(true)}>
        Show toast
      </Button>
      {show && <Toast message="Booking request sent. You’ll hear back within 24 hours." onDismiss={() => setShow(false)} />}
    </>
  );
}

export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Trigger (live)" kind="interactive" note="appears bottom-centre">
        <ToastTrigger />
      </Cell>
    </CellGrid>
  ),
};
