import { ReactNode } from "react";
import { Wordmark } from "@/components/layout";

/**
 * The call room's look, from the wireframe: a full-screen navy room with no app chrome. A slim header (wordmark, what the
 * session is, an optional status on the right) above whatever the room shows.
 */
export function RoomFrame({ title, who, right, children }: { title: string; who: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="from-primary to-primary-hover flex min-h-screen flex-col bg-linear-to-br text-white">
      <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Wordmark />
        <p className="text-small hidden text-white/70 sm:block">
          {title} · {who}
        </p>
        {right ?? <span />}
      </header>
      {children}
    </div>
  );
}
