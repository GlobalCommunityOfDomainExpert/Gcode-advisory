import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ArrowRight, CalendarClock } from "lucide-react";
import { Button, type ButtonVariant } from "@/components/atoms/button";
import { Icon } from "@/components/atoms";
import { Cell, CellGrid, Matrix } from "../../_cell";

const meta = {
  component: Button,
  tags: ["ai-generated"],
  args: {
    children: "Publish Event",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = { args: { variant: "secondary" } };
export const Danger: Story = { args: { variant: "danger" } };

export const Loading: Story = {
  args: { variant: "primary", loading: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: /publish event/i });
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toBeDisabled();
  },
};

// CssCheck — Button's primary variant uses bg-primary (--g-color-primary:
// hsl(206, 42%, 18%) -> rgb(27, 48, 65)); fails if Tailwind/global CSS
// did not load into the preview.
export const CssCheck: Story = {
  args: { variant: "primary" },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: /publish event/i });
    await expect(getComputedStyle(button).backgroundColor).toBe(
      "rgb(27, 48, 65)",
    );
  },
};

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "outline", "ghost", "danger", "success", "danger-ghost", "accent"];
const HOVER: Record<string, string> = {
  primary: "bg-primary-hover!",
  secondary: "bg-bg-light!",
  outline: "bg-primary-light!",
  ghost: "bg-primary-light!",
  danger: "bg-danger/90!",
  success: "bg-success/90!",
  "danger-ghost": "bg-danger-light!",
  accent: "bg-secondary-hover!",
};
const FOCUS = "ring-2! ring-primary! ring-offset-2!";

/** Every state, laid out like the wireframe components page (Button section). */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Variant × state" kind="interactive" wide fill note="hover / focus pinned">
        <Matrix
          first="Variant"
          cols={["Default", "Hover", "Focus", "Disabled"]}
          rows={VARIANTS}
          cell={(v, s) => (
            <Button
              variant={v as ButtonVariant}
              size="sm"
              className={s === "Hover" ? HOVER[v] : s === "Focus" ? FOCUS : ""}
              disabled={s === "Disabled"}
            >
              Button
            </Button>
          )}
        />
      </Cell>
      <Cell label="Size sm" kind="variant">
        <Button size="sm">Small</Button>
      </Cell>
      <Cell label="Size md" kind="variant">
        <Button size="md">Medium</Button>
      </Cell>
      <Cell label="With leading icon" kind="variant">
        <Button variant="secondary">
          <Icon icon={CalendarClock} size="sm" /> Reschedule
        </Button>
      </Cell>
      <Cell label="With trailing icon" kind="variant">
        <Button>
          Continue <Icon icon={ArrowRight} size="sm" />
        </Button>
      </Cell>
      <Cell label="Full width" kind="variant" fill>
        <Button className="w-full">Pay ₹1,200</Button>
      </Cell>
      <Cell label="On navy: light / onDark" kind="variant" dark note="wireframe-only">
        <Button variant="light">Primary</Button>
        <Button variant="onDark">Secondary</Button>
      </Cell>
      <Cell label="Loading" kind="empty">
        <Button loading>Saving</Button>
      </Cell>
    </CellGrid>
  ),
};
