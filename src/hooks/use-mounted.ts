"use client";

import { useSyncExternalStore } from "react";

// Server (and the client's first hydration pass) reports false so output
// matches; React then forces the corrected client-only render right after.
function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
