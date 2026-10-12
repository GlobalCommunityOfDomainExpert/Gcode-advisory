import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bell, TriangleAlert, UserRound, Wallet, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { Avatar, Badge, ButtonLink, Icon } from "@/components/atoms";
import { Banner } from "@/components/molecules";
import { SettingGroup, ValueLine, VisibilityTag } from "@/components/domain";
import { ords } from "@/lib/server/ords";
import { loadProfile } from "@/lib/server/profile";
import { getSession } from "@/lib/server/session";
import { ROLE_BY_NAME, ROLE_LABEL } from "@/lib/profile/types";
import type { NotificationPrefs } from "@/lib/notifications/types";
import type { PayoutAccount } from "@/lib/booking/types";
import { DangerZone } from "./_components/danger-zone";
import { NotificationSettings } from "./_components/notification-settings";
import { PasswordReset } from "./_components/password-reset";
import { PayoutAccountSettings } from "./_components/payout-settings";

export const metadata: Metadata = { title: "Account settings" };

interface Account {
  name: string;
  email: string;
  phoneLast4: string | null;
  phoneVerified: boolean;
  deactivated: boolean;
  memberSince: string;
}

/** Same structure as the wireframe: Account, then Preferences, then the Danger zone. Only what we actually collect or do today. */
const SECTIONS = [
  { id: "account", label: "Account", group: "Account", icon: UserRound, desc: "The details you signed up with, and how you sign in.", visibility: true },
  { id: "payouts", label: "Payouts", group: "Account", icon: Wallet, desc: "Where GCODE sends your earnings.", visibility: true, expertOnly: true },
  { id: "notifications", label: "Notifications", group: "Preferences", icon: Bell, desc: "Choose how we reach you about bookings and reminders.", visibility: true },
  { id: "danger", label: "Danger zone", group: "Danger zone", icon: TriangleAlert, desc: "Pause your account. Nothing is deleted.", visibility: false },
] as const satisfies readonly { id: string; label: string; group: string; icon: LucideIcon; desc: string; visibility: boolean; expertOnly?: boolean }[];
type SectionId = (typeof SECTIONS)[number]["id"];
const GROUPS = ["Account", "Preferences", "Danger zone"];

const since = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

/**
 * Private account facts, only what sign-up collected, plus three notification switches and a pause button. How you appear to
 * others lives in Profile. Payments, privacy and the rest arrive with their own sprints, so they are not here.
 */
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { section: raw } = await searchParams;
  const isExpert = session.roleName === "EXPERT";
  const sections = SECTIONS.filter((s) => !("expertOnly" in s) || isExpert);
  const current = sections.find((s) => s.id === raw) ?? sections[0];
  const role = ROLE_BY_NAME[session.roleName];
  const [res, loaded, prefs, payoutAccount] = await Promise.all([
    ords<Account>("/profiles/account", { token: session.token }),
    role ? loadProfile({ session, role }) : null,
    current.id === "notifications" ? ords<NotificationPrefs>("/notifications/prefs", { token: session.token }) : null,
    current.id === "payouts" && isExpert ? ords<PayoutAccount>("/payouts/account", { token: session.token }) : null,
  ]);

  if (!res.ok) {
    return (
      <>
        <PageHeader eyebrow="Account settings" title="Account settings" />
        <Banner tone="danger">We couldn’t load your account details. Please refresh the page in a moment.</Banner>
      </>
    );
  }
  const a = res.data;
  const danger = current.id === "danger";

  const navItem = (id: SectionId) => {
    const s = sections.find((x) => x.id === id)!;
    const on = s.id === current.id;
    return (
      <Link
        key={s.id}
        href={`/settings?section=${s.id}`}
        aria-current={on ? "page" : undefined}
        className={`text-body focus-visible:ring-primary -ml-px flex w-full items-center gap-3 border-l-2 py-2 pl-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none ${
          on ? "border-secondary text-primary font-semibold" : "text-text-secondary hover:text-text-primary border-transparent"
        } ${s.id === "danger" && !on ? "hover:text-danger" : ""}`}
      >
        <Icon icon={s.icon} size="sm" className={on ? "" : "opacity-70"} />
        <span className="truncate">{s.label}</span>
      </Link>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Account settings"
        title={a.name}
        subtitle={`${a.email}${role ? ` · ${ROLE_LABEL[role]}` : ""} · Member since ${since(a.memberSince)}`}
        lead={<Avatar alt={a.name} src={loaded?.profile.files.photo?.url} sizeClassName="size-16" fillClassName="ring-4 ring-surface-light shadow-md" />}
        extra={
          <p className="text-small text-text-secondary flex flex-wrap items-center gap-x-2 gap-y-2">
            <VisibilityTag type="private" /> Everything here is private. What others see is in your Profile.{" "}
            <Link href="/profile/view" className="text-primary focus-visible:ring-primary inline-flex items-center gap-1 rounded-sm font-semibold hover:underline focus-visible:ring-2 focus-visible:outline-none">
              Open profile <Icon icon={ArrowRight} size="sm" />
            </Link>
          </p>
        }
      />

      <div className="grid items-start gap-x-14 gap-y-6 pt-2 pb-8 sm:pt-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="sticky top-6 hidden space-y-7 lg:block">
          {GROUPS.filter((g) => sections.some((s) => s.group === g)).map((g) => (
            <div key={g}>
              <p className="text-small text-text-secondary mb-2 pl-4 font-bold tracking-widest uppercase">{g}</p>
              <div className="border-border-light border-l">{sections.filter((s) => s.group === g).map((s) => navItem(s.id))}</div>
            </div>
          ))}
        </nav>

        <div className="min-w-0">
          <nav aria-label="Settings sections" className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
            {sections.map((s) => (
              <Link
                key={s.id}
                href={`/settings?section=${s.id}`}
                aria-current={s.id === current.id ? "page" : undefined}
                className={`text-small focus-visible:ring-primary shrink-0 rounded-full px-3.5 py-1.5 font-semibold focus-visible:ring-2 focus-visible:outline-none ${
                  s.id === current.id ? "bg-primary text-white" : "bg-surface-light text-text-secondary ring-primary/10 ring-1"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </nav>

          <section className={`bg-surface-light rounded-lg px-5 py-6 shadow-sm ring-1 sm:px-9 sm:py-9 ${danger ? "ring-danger/30" : "ring-primary/10"}`}>
            <div className="flex items-start justify-between gap-4 pb-6">
              <div>
                <h2 className={`text-heading font-bold ${danger ? "text-danger" : "text-text-primary"}`}>{current.label}</h2>
                <p className="text-body text-text-secondary mt-1">{current.desc}</p>
              </div>
              {current.visibility && <VisibilityTag type="private" />}
            </div>

            {current.id === "account" && (
              <div>
                <SettingGroup title="Name" description="Shown on your profile and in bookings.">
                  <ValueLine text={a.name} action={<ButtonLink href="/profile?tab=basic" variant="outline" size="sm">Edit in profile</ButtonLink>} />
                </SettingGroup>

                <SettingGroup title="Email" description="Where we send booking updates and reminders. It is also your sign-in.">
                  <ValueLine
                    text={
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {a.email}
                        <Badge tone="success" size="sm">Verified</Badge>
                      </span>
                    }
                  />
                </SettingGroup>

                <SettingGroup title="Phone" description="Collected when you signed up. Only you see it.">
                  <ValueLine
                    text={
                      <span className="inline-flex flex-wrap items-center gap-2">
                        {a.phoneLast4 ? `•••• •• ${a.phoneLast4}` : "Not added"}
                        {a.phoneVerified && <Badge tone="success" size="sm">Verified</Badge>}
                      </span>
                    }
                  />
                </SettingGroup>

                {role && (
                  <SettingGroup title="Account type" description="Chosen when you signed up.">
                    <ValueLine text={ROLE_LABEL[role]} />
                  </SettingGroup>
                )}

                <SettingGroup title="Password" description="Use a strong password you don’t use elsewhere.">
                  <PasswordReset email={a.email} />
                </SettingGroup>

              </div>
            )}

            {current.id === "notifications" &&
              (prefs?.ok ? (
                <NotificationSettings initial={prefs.data} email={a.email} />
              ) : (
                <Banner tone="danger">We couldn’t load your notification settings. Please refresh the page in a moment.</Banner>
              ))}

            {current.id === "payouts" &&
              (payoutAccount?.ok ? (
                <PayoutAccountSettings account={payoutAccount.data} />
              ) : (
                <Banner tone="danger">We couldn’t load your payout account. Please refresh the page in a moment.</Banner>
              ))}

            {current.id === "danger" && <DangerZone deactivated={a.deactivated} />}
          </section>
        </div>
      </div>
    </>
  );
}
