import { CalendarClock, LogIn, Settings, UserPlus, Users } from "lucide-react";
import { ButtonLink } from "@/components/atoms";
import { NextSteps, StatusPage, type NextStep } from "./status-page";
import { NotFoundGlyph } from "./status-glyph";
import { SearchExperts } from "./search-experts";

const SIGNED_IN: NextStep[] = [
  { href: "/directory", icon: Users, label: "Find an expert", hint: "Browse people and book a session" },
  { href: "/bookings", icon: CalendarClock, label: "My bookings", hint: "Your requests and sessions" },
  { href: "/settings", icon: Settings, label: "Account settings", hint: "Profile, payouts and notifications" },
];

const SIGNED_OUT: NextStep[] = [
  { href: "/directory", icon: Users, label: "Find an expert", hint: "Browse people and see who is bookable" },
  { href: "/sign-in", icon: LogIn, label: "Sign in", hint: "Pick up where you left off" },
  { href: "/sign-up", icon: UserPlus, label: "Create an account", hint: "Free to join" },
];

/**
 * The page for a link that leads nowhere (the wireframe's "Page not found"). The ring in the 404 is the logo's own; the words say that
 * nothing was lost; and a search box and three ways onward mean the visitor is never at a dead end. Signed in people get My bookings and
 * Account settings, signed out people get Sign in and Create an account.
 */
export function NotFoundScreen({ signedIn }: { signedIn: boolean }) {
  return (
    <StatusPage
      glyph={<NotFoundGlyph />}
      reassurance="Even when a link is lost, your account and everything in it is exactly as you left it."
      eyebrow="Page not found"
      title="We can’t find that page"
      description="The link may be old or mistyped. Your account and bookings are safe."
      actions={
        <>
          <ButtonLink href="/directory">Go to the Directory</ButtonLink>
          {signedIn ? (
            <ButtonLink href="/bookings" variant="secondary">
              My bookings
            </ButtonLink>
          ) : (
            <ButtonLink href="/sign-in" variant="secondary">
              Sign in
            </ButtonLink>
          )}
        </>
      }
      footnote="Think this is a mistake? Reply to any GCODE email and we’ll look into it."
    >
      <SearchExperts />
      <NextSteps items={signedIn ? SIGNED_IN : SIGNED_OUT} />
    </StatusPage>
  );
}
