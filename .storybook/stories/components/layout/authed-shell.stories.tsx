import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { AuthedShell } from "@/components/layout/authed-shell";
import { AARAV, AARAV_EMAIL, EXPERT_NOTIFICATIONS, EXPERT_SIDEBAR_LINKS } from "../../_fixtures";

const meta = {
  component: AuthedShell,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
  args: {
    user: AARAV,
    email: AARAV_EMAIL,
    links: [{ label: "Find an expert", href: "/directory" }],
    sidebarLinks: EXPERT_SIDEBAR_LINKS,
    notifications: EXPERT_NOTIFICATIONS,
    profileCompletion: 45,
    children: <div className="p-10">Page content</div>,
  },
} satisfies Meta<typeof AuthedShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default frame for every signed-in page: navbar (bell + account menu), sidebar, page, footer. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Page content")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /aarav sharma/i })).toBeVisible();
  },
};

export const ProfileComplete: Story = { args: { profileCompletion: 100 } };

/** Focused flow: no sidebar and no hamburger, so nothing pulls the user out of the call. */
export const CallRoomNoSidebar: Story = {
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/call/abc123" } } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("navigation", { name: "Sidebar", hidden: true })).toBeNull();
    await expect(canvas.queryByLabelText(/open menu/i)).toBeNull();
  },
};

export const CheckoutNoSidebar: Story = {
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/checkout" } } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("navigation", { name: "Sidebar", hidden: true })).toBeNull();
  },
};

/** Sidebar stays on for ordinary pages, even ones that merely start with the same letters. */
export const CheckoutLookalikeKeepsSidebar: Story = {
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: "/checkouts-history" } } },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("navigation", { name: "Sidebar", hidden: true }).length).toBeGreaterThan(0);
  },
};

export const ForcedHidden: Story = { args: { hideSidebar: true } };

/** Desktop users can shrink the sidebar to an icon rail from the navbar; the choice is remembered. */
export const CollapsibleSidebar: Story = {
  play: async ({ canvas, userEvent }) => {
    localStorage.removeItem("gcode.sidebar");
    const aside = () => document.querySelector("aside") as HTMLElement;
    await expect(aside()).toHaveClass("w-72");
    await userEvent.click(canvas.getByLabelText(/collapse sidebar/i));
    await waitFor(() => expect(aside()).toHaveClass("w-21"));
    // still there, just compact: icon links stay reachable by name
    await expect(aside().querySelector('a[aria-label="Dashboard"]')).not.toBeNull();
    await expect(localStorage.getItem("gcode.sidebar")).toBe("compact");
    await userEvent.click(canvas.getByLabelText(/expand sidebar/i));
    await waitFor(() => expect(aside()).toHaveClass("w-72"));
    localStorage.removeItem("gcode.sidebar");
  },
};

export const NotCollapsible: Story = {
  args: { collapsible: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByLabelText(/collapse sidebar/i)).toBeNull();
  },
};
