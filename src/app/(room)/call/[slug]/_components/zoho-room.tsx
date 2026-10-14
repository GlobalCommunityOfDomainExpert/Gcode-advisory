"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Star, Video, X } from "lucide-react";
import { Button, ButtonLink } from "@/components/atoms";
import { RoomFrame, RoomPanel } from "./room-frame";
import { EndWarning, ExtendButton } from "./end-warning";
import { mmss, useCallClock } from "@/lib/booking/use-call-clock";

/** The video service's own addresses: only messages from these are trusted. */
const VIDEO_ORIGIN =
  /^https:\/\/(meeting|meet)\.zoho\.(com|in|eu|com\.au|jp|sa)$|^https:\/\/meeting\.zohocloud\.ca$/;
/** Words in a message from the video service that mean "this person's call is over". */
const ENDED =
  /participant[_ .-]?left|meeting[_ .-]?end|call[_ .-]?end|session[_ .-]?end|ended|left[_ .-]?meeting|leave[_ .-]?meeting|disconnect/i;

/**
 * The video page lives on another site, so we cannot read its DOM or its buttons. What we CAN see is every time the frame loads a new
 * page. In a call the frame loads the join/room pages once or twice; when the person ends the call, the service sends the frame to
 * its feedback page and then its own landing page, which is a further load. From this load onwards we treat the call as over, take
 * the frame away and show our own "you left" page. Every load is logged ("[video frame]") so the number can be checked on the live site
 * (localhost is not a registered address, so this only runs for real on the site). Override with NEXT_PUBLIC_ZOHO_END_LOADS.
 */
const END_LOADS = Math.max(
  2,
  Number(process.env.NEXT_PUBLIC_ZOHO_END_LOADS) || 3,
);
/** How long the "time was added" toast stays. */
const TOAST_MS = 7000;

/**
 * The real video call, shown inside our own page: the video service's room (the host link for the expert, the join link for
 * the booker) in an iframe that fills everything under the header, under our clock. The clock is the session's, not the vendor's:
 * the notices (five minutes left, time added, the expert's "+15 min") float over the corner of the frame as toasts so the call
 * keeps all the space. When the time is up the iframe is removed, which disconnects this person, and the end page takes its place.
 * When the person leaves earlier (the video service says so) a "you left" page shows, with Rejoin while time remains.
 * The vendor's room only loads from the registered site address.
 */
export function ZohoRoom({
  title,
  who,
  url,
  endAt,
  slug,
  bookingId,
  backHref,
}: {
  title: string;
  who: string;
  url: string;
  endAt: string;
  slug: string;
  bookingId: number;
  backHref: string;
}) {
  const clock = useCallClock(slug, endAt, bookingId);
  const [over, setOver] = useState(false); // the video service ended the call for this person, inside the frame
  const [seenMin, setSeenMin] = useState(0); // the minutes-added figure whose toast was dismissed or timed out
  const loads = useRef(0);
  const ended = clock.phase === "ended";
  const inCall = !ended && !over;

  useEffect(() => {
    loads.current = 0;
  }, [inCall]);

  // when more time is added, say so for a few seconds
  useEffect(() => {
    if (clock.extendedMin <= 0) return;
    const added = clock.extendedMin;
    const t = setTimeout(() => setSeenMin(added), TOAST_MS);
    return () => clearTimeout(t);
  }, [clock.extendedMin]);
  const note = clock.extendedMin > 0 && clock.extendedMin !== seenMin;

  // When the person ends the call inside the video service, it tells us with a message from its own origin ("participant-left"), or
  // moves the frame to its feedback and landing pages (counted below). Every message is logged to the console.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!VIDEO_ORIGIN.test(e.origin)) return;
      const text =
        typeof e.data === "string" ? e.data : JSON.stringify(e.data ?? "");
      console.info("[video message]", e.origin, text.slice(0, 300));
      if (ENDED.test(text)) setOver(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const timer = (
    <span
      className="text-small inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium text-white tabular-nums"
      role="timer"
      aria-label="Time left in the session"
    >
      <span
        className={`size-2 rounded-full ${clock.phase === "warn" ? "bg-warning animate-pulse" : "bg-danger"}`}
        aria-hidden="true"
      />
      {ended ? "0:00" : mmss(clock.left)} left
    </span>
  );

  if (ended) {
    return (
      <RoomFrame title={title} who={who}>
        <RoomPanel>
          <p className="text-small font-bold tracking-widest text-white/60 uppercase">
            Session ended
          </p>
          <h1 className="text-heading font-extrabold">Time’s up. Thank you!</h1>
          <p className="text-body text-white/70">
            Your session with {who} has ended and the call was closed for you.
          </p>
          <p className="text-small text-white/60">
            You can rate the session in My Bookings once it has been finalised,
            about 15 minutes after the scheduled end. We’ll also send a
            reminder.
          </p>
          <div className="pt-2">
            <ButtonLink href={backHref} variant="light" size="sm">
              <Star className="size-4" aria-hidden="true" /> Go to My Bookings
              to rate
            </ButtonLink>
          </div>
        </RoomPanel>
      </RoomFrame>
    );
  }

  if (over) {
    return (
      <RoomFrame title={title} who={who} right={timer}>
        <RoomPanel>
          <p className="text-small font-bold tracking-widest text-white/60 uppercase">
            You left the call
          </p>
          <h1 className="text-heading font-extrabold">Thanks for joining</h1>
          <p className="text-body text-white/70">
            Your session with {who} still has{" "}
            <b className="tabular-nums">{mmss(clock.left)}</b> on the clock. You
            can go back into the call, or head back to your bookings.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="light" size="sm" onClick={() => setOver(false)}>
              <Video className="size-4" aria-hidden="true" /> Rejoin the call
            </Button>
            <ButtonLink href={backHref} variant="onDark" size="sm">
              <ArrowLeft className="size-4" aria-hidden="true" /> Back to My
              Bookings
            </ButtonLink>
          </div>
        </RoomPanel>
      </RoomFrame>
    );
  }

  return (
    <RoomFrame title={title} who={who} right={timer}>
      <main className="relative flex w-full flex-1 flex-col">
        <iframe
          title="Video call"
          src={url}
          allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-read; clipboard-write"
          onLoad={(e) => {
            loads.current += 1;
            console.info(
              "[video frame] load",
              loads.current,
              "of",
              END_LOADS,
              (e.currentTarget as HTMLIFrameElement).src,
            );
            if (loads.current >= END_LOADS) setOver(true);
          }}
          className="min-h-[65vh] w-full flex-1 border-0 bg-black/40"
        />
        {/* toasts: over the top-left corner of the frame, away from the video service's own toolbar */}
        <div className="pointer-events-none absolute top-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-2">
          <EndWarning clock={clock} className="pointer-events-auto shadow-lg" />
          {note && (
            <p
              role="status"
              className="text-small pointer-events-auto flex items-center gap-2 rounded-md bg-black/75 py-2 pr-2 pl-3 text-white shadow-lg"
            >
              The expert added {clock.extendedMin} minutes. It costs nothing
              extra.
              <button
                type="button"
                onClick={() => setSeenMin(clock.extendedMin)}
                aria-label="Dismiss"
                className="rounded p-1 hover:bg-white/10"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </p>
          )}
          <ExtendButton
            clock={clock}
            className="pointer-events-auto items-start"
          />
        </div>
      </main>
    </RoomFrame>
  );
}
