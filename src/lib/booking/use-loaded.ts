"use client";

import { useEffect, useState } from "react";

/**
 * Loads something for a key and hands back the result, or null while it is loading (or the key just changed).
 * The result is stored together with its key, so a stale answer can never be shown for a newer choice.
 * Pass a null key to load nothing.
 */
export function useLoaded<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>): T | null {
  const [state, setState] = useState<{ key: string; value: T } | null>(null);
  useEffect(() => {
    if (key === null) return;
    const ctrl = new AbortController();
    load(ctrl.signal).then((value) => {
      if (!ctrl.signal.aborted) setState({ key, value });
    });
    return () => ctrl.abort();
    // `load` is recreated every render on purpose: only the key decides when to fetch again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state !== null && state.key === key ? state.value : null;
}
