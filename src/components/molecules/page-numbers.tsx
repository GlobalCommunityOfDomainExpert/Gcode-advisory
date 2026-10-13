"use client";

import { useRouter } from "next/navigation";
import { Pagination } from "./pagination";

/**
 * The numbered pager (Previous, 1 2 3 4 5, Next) for a list the server pages. Each page is an address (?page=3), so the page survives a
 * refresh, can be shared and works with the browser's back button; this only turns a click on a number into that navigation.
 * Renders nothing when everything fits on one page.
 */
export function PageNumbers({ page, hrefs, label = "More results" }: { page: number; hrefs: string[]; label?: string }) {
  const router = useRouter();
  if (hrefs.length <= 1) return null;
  return (
    <div className="flex justify-center pb-8" role="navigation" aria-label={label}>
      <Pagination page={page} totalPages={hrefs.length} onPageChange={(p) => router.push(hrefs[p - 1] ?? hrefs[0])} />
    </div>
  );
}
