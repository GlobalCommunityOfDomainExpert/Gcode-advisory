import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { GuestShell } from "@/components/layout/guest-shell";

const meta = {
  component: GuestShell,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  args: {
    links: [{ label: "Find an expert", href: "/directory" }],
    children: <div className="p-10">Public page</div>,
  },
} satisfies Meta<typeof GuestShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Signed-out frame: Sign in / Register, no sidebar. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Register" })).toBeVisible();
  },
};

export const TransparentNavbar: Story = {
  args: {
    transparent: true,
    children: (
      <div className="from-primary to-primary-hover -mx-4 h-96 bg-linear-to-br p-10 pt-32 text-white sm:-mx-6 lg:-mx-8">
        <h1 className="text-display font-bold">Public hero</h1>
      </div>
    ),
  },
};
