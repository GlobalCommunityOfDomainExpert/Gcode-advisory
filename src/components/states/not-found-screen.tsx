import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";

/**
 * The page for a link that leads nowhere (the wireframe's "Page not found"): a compass, one calm sentence that nothing was lost,
 * and the two ways back. Signed in people get My bookings as the second way; signed out people get Sign in.
 */
export function NotFoundScreen({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="mx-auto w-full max-w-md py-16">
      <EmptyState
        icon={Compass}
        title="We can’t find that page"
        description="The link may be old or mistyped. Your account and bookings are safe."
        action={
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
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
          </div>
        }
      />
    </div>
  );
}
