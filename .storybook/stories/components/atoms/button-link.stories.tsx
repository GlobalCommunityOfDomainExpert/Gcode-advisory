import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { ButtonLink } from "@/components/atoms/button-link";

const meta = {
  component: ButtonLink,
  tags: ["ai-generated"],
  args: {
    href: "/events/gcode-build-sprint-2026",
    children: "View Event",
  },
} satisfies Meta<typeof ButtonLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: "primary" } };
export const Secondary: Story = { args: { variant: "secondary" } };

export const RendersRealHref: Story = {
  args: { variant: "primary" },
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: /view event/i });
    await expect(link).toHaveAttribute(
      "href",
      "/events/gcode-build-sprint-2026",
    );
  },
};
