"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/molecules";

/** The search box. The term lives in the URL (/directory?term=design), so a search can be shared and survives a refresh. */
export function DirectorySearch({ initial }: { initial: string }) {
  const router = useRouter();
  const [term, setTerm] = useState(initial);

  function submit(value: string) {
    const t = value.trim().slice(0, 40);
    router.push(t ? `/directory?term=${encodeURIComponent(t)}` : "/directory");
  }

  return <SearchBar className="max-w-xl" value={term} onChange={setTerm} onSubmit={submit} placeholder="Search by name, skill or topic" />;
}
