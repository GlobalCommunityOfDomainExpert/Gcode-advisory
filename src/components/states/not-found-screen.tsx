import { ButtonLink } from "@/components/atoms";
import { StatusPage } from "./status-page";
import { NotFoundGlyph } from "./status-glyph";

/**
 * The page for a link that leads nowhere (the wireframe's "Page not found"): the mark, one sentence that nothing was lost, and the two
 * ways back. Signed in people also get links to Account settings and their profile, signed out people to Create an account.
 */
export function NotFoundScreen({ signedIn }: { signedIn: boolean }) {
  return (
    <StatusPage
      glyph={<NotFoundGlyph />}
      title="We can’t find that page"
      description="The link may be old or mistyped. Your account and bookings are safe."
      actions={
        <>
          <ButtonLink href="/directory" variant="secondary">
            Go to the Directory
          </ButtonLink>
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
      links={
        signedIn
          ? [
              { href: "/settings", label: "Account settings" },
              { href: "/profile/view", label: "My profile" },
            ]
          : [{ href: "/sign-up", label: "Create an account" }]
      }
    />
  );
}
