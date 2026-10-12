import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchX, Users } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { ButtonLink } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import type { DirectoryList } from "@/lib/booking/types";
import { DirectorySearch } from "./_components/directory-search";
import { ExpertCardView } from "./_components/expert-card";

export const metadata: Metadata = { title: "Directory" };

const PAGE = 12;

/** Domain experts: search, honest bookability, a Book button where it applies. The (app) layout guarantees a signed-in user. */
export default async function DirectoryPage({ searchParams }: { searchParams: Promise<{ term?: string; skip?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { term: rawTerm, skip: rawSkip } = await searchParams;
  const term = (rawTerm ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 40);
  const skip = /^\d{1,5}$/.test(rawSkip ?? "") ? Number(rawSkip) : 0;

  const res = await ords<DirectoryList>(
    `/directory/experts?term=${encodeURIComponent(term)}&page_skip=${skip}&page_len=${PAGE}`,
    { token: session.token },
  );

  const href = (n: number) => `/directory?${new URLSearchParams({ ...(term ? { term } : {}), ...(n > 0 ? { skip: String(n) } : {}) }).toString()}`;

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Find an expert"
        subtitle="Book a one-to-one session with a domain expert."
        extra={<DirectorySearch key={term} initial={term} />}
      />
      {!res.ok ? (
        <EmptyState icon={Users} title="We couldn’t load the directory" description="Please refresh the page in a moment." />
      ) : res.data.items.length === 0 ? (
        term ? (
          <EmptyState
            icon={SearchX}
            title="No matches"
            description={`Nobody matches “${term}”. Try a different word, or clear the search.`}
            action={<ButtonLink href="/directory" variant="secondary" size="sm">Clear search</ButtonLink>}
          />
        ) : (
          <EmptyState icon={Users} title="No experts yet" description="Experts appear here once they finish and publish their profile." />
        )
      ) : (
        <>
          <div className="grid gap-6 pb-6 sm:grid-cols-2 xl:grid-cols-3">
            {res.data.items.map((e) => (
              <ExpertCardView key={e.userId} expert={e} paymentsEnabled={res.data.paymentsEnabled} />
            ))}
          </div>
          {(skip > 0 || res.data.hasMore) && (
            <nav aria-label="More experts" className="flex items-center justify-between gap-3 pb-8">
              {skip > 0 ? (
                <Link href={href(Math.max(0, skip - PAGE))} className="text-primary text-body font-bold underline underline-offset-2">
                  Previous
                </Link>
              ) : (
                <span />
              )}
              {res.data.hasMore && (
                <Link href={href(skip + PAGE)} className="text-primary text-body font-bold underline underline-offset-2">
                  Next
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}
