"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtTime, secondsLeft } from "@/lib/booking/time";

/** "Opens in 3 h 20 min", ticking, for the dark room. At zero the page asks the server again and shows the lobby. */
export function OpensIn({ opensAt }: { opensAt: string }) {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const s = secondsLeft(opensAt);
      setLeft(s);
      if (s === 0) router.refresh();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [opensAt, router]);

  const text = (() => {
    if (left === null) return "";
    const h = Math.floor(left / 3600);
    const m = Math.floor((left % 3600) / 60);
    if (h >= 24) return `${Math.floor(h / 24)} d ${h % 24} h`;
    if (h > 0) return `${h} h ${m} min`;
    if (m > 0) return `${m} min ${left % 60} s`;
    return `${left} s`;
  })();

  return (
    <div className="space-y-3">
      <p className="text-small font-bold tracking-widest text-white/60 uppercase">Not open yet</p>
      <h1 className="text-heading font-extrabold">The room opens 10 minutes before the session</h1>
      <p className="text-body text-white/70">That’s at {fmtTime(opensAt)} IST. This page opens the lobby by itself when it’s time.</p>
      <p className="text-display font-extrabold tabular-nums" aria-live="off">
        {text && `Opens in ${text}`}
      </p>
    </div>
  );
}
