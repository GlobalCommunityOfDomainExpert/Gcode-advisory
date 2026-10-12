"use client";

import { useCallback, useEffect, useState } from "react";
import type { NotificationItem, NotificationList } from "./types";

const POLL_MS = 60_000;

async function post(path: string, body: unknown) {
  try {
    await fetch(path, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    /* the next poll puts things right */
  }
}

/**
 * The bell's data: loads on mount, every minute while the tab is visible, and when the tab comes back into focus.
 * Reading is optimistic (the badge drops at once) and told to the server in the background.
 */
export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as NotificationList;
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      /* offline: keep what we have */
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void load();
    };
    const first = setTimeout(tick, 0);       // the first load, outside the effect body
    const t = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearTimeout(first);
      clearInterval(t);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  const markRead = useCallback((id: number) => {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    void post("/api/notifications/read", { id });
  }, []);

  const markAllRead = useCallback(() => {
    setItems((list) => list.map((n) => ({ ...n, unread: false })));
    void post("/api/notifications/read", {});
  }, []);

  return { items, markRead, markAllRead };
}
