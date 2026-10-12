"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/molecules";

/** "Looking for someone?" on the 404 page: the same search as the directory, so a lost visitor can still find an expert. */
export function SearchExperts() {
  const router = useRouter();
  const [term, setTerm] = useState("");

  function submit(value: string) {
    const t = value.trim().slice(0, 40);
    router.push(t ? `/directory?term=${encodeURIComponent(t)}` : "/directory");
  }

  return (
    <div className="space-y-2">
      <p className="text-small text-text-secondary font-bold tracking-widest uppercase">Looking for someone?</p>
      <SearchBar value={term} onChange={setTerm} onSubmit={submit} placeholder="Search experts by name, skill or topic" />
    </div>
  );
}
