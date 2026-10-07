import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import { AppShell } from "@/components/layout/app-shell";
import { Navbar } from "@/components/layout/navbar";
import { NotifMenu } from "@/components/layout/notif-menu";
import { Sidebar } from "@/components/layout/sidebar";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { Cell, CellGrid } from "../../_cell";
import { AARAV, AARAV_EMAIL, EXPERT_NOTIFICATIONS, EXPERT_SIDEBAR_LINKS } from "../../_fixtures";

const meta = {
  component: Navbar,
  tags: ["ai-generated"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const signedIn = (
  <Navbar
    links={[{ label: "Find an expert", href: "/directory" }]}
    notifications={<NotifMenu items={EXPERT_NOTIFICATIONS} />}
    accountMenu={<ProfileMenu user={AARAV} email={AARAV_EMAIL} />}
    mobileFooter={<Sidebar variant="bare" links={EXPERT_SIDEBAR_LINKS} />}
  />
);

export const Default: Story = {};

export const SignedIn: Story = { render: () => signedIn };

export const MobileMenuOpens: Story = {
  render: () => signedIn,
  play: async ({ canvas, userEvent }) => {
    // The hamburger is `lg:hidden`, so it is display:none at desktop width; getByLabelText ignores
    // visibility. This verifies the toggle logic, not the breakpoint.
    const menuButton = canvas.getByLabelText(/open menu/i);
    await userEvent.click(menuButton);
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  },
};

/** Signed out: Sign in + Register replace the bell and account menu. */
export const SignedOut: Story = {
  render: () => <Navbar links={[{ label: "Find an expert", href: "/directory" }]} />,
};

const tallPage = (
  <>
    <div className="from-primary to-primary-hover -mx-4 -mt-0 h-96 bg-linear-to-br p-10 pt-32 text-white sm:-mx-6 lg:-mx-8">
      <h1 className="text-display font-bold">Hero behind a transparent navbar</h1>
      <p className="text-body mt-2 text-white/70">Scroll: the bar turns solid navy.</p>
    </div>
    <div className="h-[120vh] p-10">Page content</div>
  </>
);

/** Opt-in: floats over a hero and turns solid after the page scrolls 8px (events-style). */
export const TransparentOverHero: Story = {
  parameters: { layout: "fullscreen" },
  render: () => <AppShell navbar={<Navbar transparent />}>{tallPage}</AppShell>,
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector("header") as HTMLElement;
    await expect(header).toHaveClass("bg-transparent");
    const scroller = canvasElement.querySelector("#app-scroll-region") as HTMLElement;
    scroller.scrollTop = 200;
    scroller.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(header).toHaveClass("bg-primary"));
  },
};

/** Every state, laid out like the wireframe components page. */
export const States: Story = {
  render: () => (
    <CellGrid>
      <Cell label="Signed in" frame fill wide note="menus are live">
        {signedIn}
      </Cell>
      <Cell label="Guest" kind="variant" frame fill wide>
        <Navbar guest />
      </Cell>
    </CellGrid>
  ),
};
