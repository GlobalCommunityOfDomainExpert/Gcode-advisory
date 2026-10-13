import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SearchX, Users } from "lucide-react";
import { PageHeader } from "@/components/layout";
import { ButtonLink } from "@/components/atoms";
import { EmptyState, PageNumbers } from "@/components/molecules";
import { PAGE_SIZE, pageFrom, pageHrefs, skipFor } from "@/lib/paging";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import type { DirectoryFilters, DirectoryList, DirectorySort } from "@/lib/booking/types";
import { directoryHref, type DirectoryQuery } from "@/lib/booking/directory-query";
import { DirectoryControls } from "./_components/directory-controls";
import { ExpertCardView } from "./_components/expert-card";

export const metadata: Metadata = { title: "Directory" };

const SORTS: DirectorySort[] = ["relevance", "rating", "price"];

/** A value typed into the address: no control characters, trimmed, cut to a sensible length. */
const clean = (raw: string | undefined, max: number) => (raw ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);

/**
 * Domain experts, laid out like the wireframe's directory without its tabs: a filter card (search and chips), a sticky toolbar (count,
 * applied filters, Bookable now, sort) and the card grid, 25 a page. Search, filters, sort and page all live in the address. Honest
 * bookability, and a Book button only where it applies. The (app) layout guarantees a signed-in user.
 */
export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ term?: string; domain?: string; location?: string; service?: string; price_min?: string; price_max?: string; bookable?: string; sort?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const sp = await searchParams;
  const query: DirectoryQuery = {
    term: clean(sp.term, 40),
    domain: clean(sp.domain, 100),
    location: clean(sp.location, 100),
    service: clean(sp.service, 100),
    priceMin: /^\d{1,7}$/.test(sp.price_min ?? "") ? String(Number(sp.price_min)) : "",
    priceMax: /^\d{1,7}$/.test(sp.price_max ?? "") ? String(Number(sp.price_max)) : "",
    bookable: sp.bookable === "1",
    sort: SORTS.find((s) => s === sp.sort) ?? "relevance",
  };
  const page = pageFrom(sp.page);

  const params = new URLSearchParams({ term: query.term, page_skip: String(skipFor(page)), page_len: String(PAGE_SIZE), sort: query.sort });
  if (query.domain) params.set("domain", query.domain);
  if (query.location) params.set("location", query.location);
  if (query.service) params.set("service", query.service);
  if (query.priceMin) params.set("price_min", query.priceMin);
  if (query.priceMax) params.set("price_max", query.priceMax);
  if (query.bookable) params.set("bookable", "1");

  const [res, filters] = await Promise.all([
    ords<DirectoryList>(`/directory/experts?${params.toString()}`, { token: session.token }),
    ords<DirectoryFilters>("/directory/filters", { token: session.token }),
  ]);

  // a page past the end (an old link, or the list just got shorter) goes back to the first page
  if (res.ok && page > 1 && res.data.items.length === 0) redirect(directoryHref(query));

  const filtered = !!(query.term || query.domain || query.location || query.service || query.priceMin || query.priceMax || query.bookable);

  return (
    <>
      <PageHeader eyebrow="Directory" title="Find your people" subtitle="Learn from people who’ve done it. Book a 1:1 call with any expert who has an open service." />
      {!res.ok ? (
        <EmptyState icon={Users} title="We couldn’t load the directory" description="Please refresh the page in a moment." />
      ) : (
        <>
          <DirectoryControls
            query={query}
            filters={filters.ok ? filters.data : { expertise: [], locations: [], services: [], maxPriceMinor: 0, paymentsEnabled: false }}
            total={res.data.total}
            bookable={res.data.bookable}
          />
          {res.data.items.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={SearchX}
                title="No matches"
                description="Try removing a filter or searching for something broader."
                action={
                  <ButtonLink href="/directory" variant="secondary" size="sm">
                    Clear filters
                  </ButtonLink>
                }
              />
            ) : (
              <EmptyState icon={Users} title="No experts yet" description="Experts appear here once they finish and publish their profile." />
            )
          ) : (
            <>
              <div className="grid gap-6 pt-2 pb-6 sm:grid-cols-2 xl:grid-cols-3">
                {res.data.items.map((e) => (
                  <ExpertCardView key={e.userId} expert={e} paymentsEnabled={res.data.paymentsEnabled} />
                ))}
              </div>
              <PageNumbers page={page} hrefs={pageHrefs(res.data.total, (n) => directoryHref(query, n))} label="More experts" />
            </>
          )}
        </>
      )}
    </>
  );
}
