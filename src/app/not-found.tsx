import type { Metadata } from "next";
import { getSession } from "@/lib/server/session";
import { NotFoundScreen } from "@/components/states";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/**
 * The 404 screen, for any page that calls notFound() (an expert, receipt or call that does not exist, or is not yours). It is shown
 * inside whatever frame the page already had: the app frame when signed in, the guest frame when signed out. A call page has no frame,
 * so it stands on its own. Unknown addresses reach it through (public)/[...missing] so they get the same frame.
 */
export default async function NotFound() {
  const session = await getSession();
  return <NotFoundScreen signedIn={!!session} />;
}
