import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SearchX, Users } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { ButtonLink } from "@/components/atoms";
import { EmptyState, PAGE_SIZE, PageNav, pageFrom, skipFor } from "@/components/molecules";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import type { DirectoryList } from "@/lib/booking/types";
import { DirectorySearch } from "./_components/directory-search";
import { ExpertCardView } from "./_components/expert-card";

export const metadata: Metadata = { title: "Directory" };

/** Domain experts: search, honest bookability, a Book button where it applies. The (app) layout guarantees a signed-in user. */
export default async function DirectoryPage({ searchParams }: { searchParams: Promise<{ term?: string; page?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { term: rawTerm, page: rawPage } = await searchParams;
  const term = (rawTerm ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 40);
  const page = pageFrom(rawPage);

  const res = await ords<DirectoryList>(
    `/directory/experts?term=${encodeURIComponent(term)}&page_skip=${skipFor(page)}&page_len=${PAGE_SIZE}`,
    { token: session.token },
  );

  if (res.ok && page > 1 && res.data.items.length === 0) redirect(term ? `/directory?term=${encodeURIComponent(term)}` : "/directory");

  const href = (n: number) => `/directory?${new URLSearchParams({ ...(term ? { term } : {}), ...(n > 1 ? { page: String(n) } : {}) }).toString()}`;

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
          <PageNav page={page} hasMore={res.data.hasMore} href={href} label="More experts" />
        </>
      )}
    </>
  );
}
