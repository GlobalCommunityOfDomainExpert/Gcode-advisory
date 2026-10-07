import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Calendar } from "lucide-react";
import { expect } from "storybook/test";
import { Icon } from "@/components/atoms/icon";
import { Cell, CellGrid } from "../../_cell";
import { ArrowLeft, ArrowRight, BadgeCheck, Bell, CalendarCheck, CalendarClock, Camera, Check, ChevronDown, CircleAlert, CircleCheck, CircleX, Clock, Eye, EyeOff, Gift, Globe, Info, LayoutDashboard, Link as LinkIcon, Lock, LogOut, MapPin, Menu, Pencil, Rocket, RotateCcw, Settings, Sparkles, Star, TriangleAlert, UserRound, UsersRound, Video, Wallet, X, type LucideIcon } from "lucide-react";

const meta = {
  component: Icon,
  tags: ["ai-generated"],
  args: {
    icon: Calendar,
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Decorative: Story = {
  play: async ({ canvasElement }) => {
    // No label -> purely decorative, must be hidden from the accessibility tree.
    const svg = canvasElement.querySelector("svg");
    await expect(svg).toHaveAttribute("aria-hidden", "true");
  },
};

export const WithAccessibleLabel: Story = {
  args: { label: "Event date" },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("img", { name: /event date/i }),
    ).toBeVisible();
  },
};

export const Large: Story = { args: { size: "lg", label: "Event date" } };

/** Every state, laid out like the wireframe components page. */
const IN_USE: [string, LucideIcon][] = [
  ["check", Check],
  ["x", X],
  ["eye", Eye],
  ["eye-off", EyeOff],
  ["camera", Camera],
  ["bell", Bell],
  ["menu", Menu],
  ["chevron-down", ChevronDown],
  ["arrow-right", ArrowRight],
  ["arrow-left", ArrowLeft],
  ["info", Info],
  ["circle-check", CircleCheck],
  ["triangle-alert", TriangleAlert],
  ["circle-alert", CircleAlert],
  ["star", Star],
  ["map-pin", MapPin],
  ["badge-check", BadgeCheck],
  ["video", Video],
  ["calendar-clock", CalendarClock],
  ["lock", Lock],
  ["globe", Globe],
  ["rocket", Rocket],
  ["pencil", Pencil],
  ["link", LinkIcon],
  ["clock", Clock],
  ["sparkles", Sparkles],
  ["wallet", Wallet],
  ["settings", Settings],
  ["user-round", UserRound],
  ["users-round", UsersRound],
  ["layout-dashboard", LayoutDashboard],
  ["calendar-check", CalendarCheck],
  ["log-out", LogOut],
  ["gift", Gift],
  ["rotate-ccw", RotateCcw],
  ["circle-x", CircleX],
];

export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Sizes" kind="variant">
        {(["sm", "md", "lg"] as const).map((s) => (
          <span key={s} className="text-text-primary flex items-center gap-2">
            <Icon icon={Bell} size={s} />
            <span className="text-small text-text-secondary">{s}</span>
          </span>
        ))}
      </Cell>
      <Cell label="Icons in use" kind="variant" wide>
        {IN_USE.map(([name, I]) => (
          <span key={name} title={name} className="text-text-primary border-border-light flex size-10 items-center justify-center rounded-sm border">
            <Icon icon={I} size="md" />
          </span>
        ))}
      </Cell>
    </CellGrid>
  ),
};
