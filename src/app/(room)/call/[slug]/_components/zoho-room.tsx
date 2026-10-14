"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PhoneOff, Star } from "lucide-react";
import { Button, ButtonLink } from "@/components/atoms";
import { RoomFrame } from "./room-frame";
import { EndWarning, ExtendButton, ExtendedNote } from "./end-warning";
import { mmss, useCallClock } from "@/lib/booking/use-call-clock";

/** The video service's own addresses: only messages from these are trusted. */
const VIDEO_ORIGIN = /^https:\/\/(meeting|meet)\.zoho\.(com|in|eu|com\.au|jp|sa)$|^https:\/\/meeting\.zohocloud\.ca$/;
/** Words in a message from the video service that mean "this person's call is over". */
const ENDED = /meeting[_ .-]?end|call[_ .-]?end|session[_ .-]?end|ended|left[_ .-]?meeting|leave[_ .-]?meeting|disconnect/i;

/**
 * The video page lives on another site, so we cannot read its DOM or its buttons. What we CAN see is every time the frame loads a new
 * page. In a call the frame loads the join/room pages once or twice; when the person ends the call, the service sends the frame to
 * its feedback page and then its own landing page, which is a further load. From this load onwards we treat the call as over, take
 * the frame away and send the person back. Every load is logged ("[video frame]") so the number can be checked on the live site
 * (localhost is not a registered address, so this only runs for real on the site). Override with NEXT_PUBLIC_ZOHO_END_LOADS.
 */
const END_LOADS = Math.max(2, Number(process.env.NEXT_PUBLIC_ZOHO_END_LOADS) || 3);
/** After the call is over we show our own panel for this long, then go back. */
const BACK_AFTER_MS = 2500;

/**
 * The real video call, shown inside our own page: the video service's room (the host link for the expert, the join link for
 * the booker) in an iframe, under our clock. The clock is the session's, not the vendor's: five minutes before the end the
 * warning appears (the expert can add 15 minutes), and when the time is up the iframe is removed, which disconnects this
 * person from the room, and the end panel takes its place. The vendor's room only loads from the registered site address.
 */
export function ZohoRoom({ title, who, url, endAt, slug, bookingId, backHref }: { title: string; who: string; url: string; endAt: string; slug: string; bookingId: number; backHref: string }) {
  const clock = useCallClock(slug, endAt, bookingId);
  const router = useRouter();
  const [left, setLeft] = useState(false);       // the person pressed Leave
  const [over, setOver] = useState(false);       // the video service ended the call inside the frame
  const loads = useRef(0);
  const ended = clock.phase === "ended";
  const inCall = !ended && !left && !over;

  useEffect(() => {
    loads.current = 0;
  }, [inCall]);

  // the call was ended inside the video service: show our panel for a moment, then go back to the page before
  useEffect(() => {
    if (!over) return;
    const t = setTimeout(() => router.push(backHref), BACK_AFTER_MS);
    return () => clearTimeout(t);
  }, [over, router, backHref]);

  // When the person ends the call inside the video service, that service moves the frame to its own landing page ("join with the app").
  // If it tells us (a message from its own origin), take the frame away at once and show our end panel instead. Every message is logged
  // to the console so the real wording can be checked against the pattern above.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!VIDEO_ORIGIN.test(e.origin)) return;
      const text = typeof e.data === "string" ? e.data : JSON.stringify(e.data ?? "");
      console.info("[video message]", e.origin, text.slice(0, 300));
      if (ENDED.test(text)) setOver(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const timer = (
    <span className="text-small inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium text-white tabular-nums" role="timer" aria-label="Time left in the session">
      <span className={`size-2 rounded-full ${clock.phase === "warn" ? "bg-warning animate-pulse" : "bg-danger"}`} aria-hidden="true" />
      {ended ? "0:00" : mmss(clock.left)} left
    </span>
  );

  if (over && !ended) {
    return (
      <RoomFrame title={title} who={who}>
        <main className="mx-auto grid w-full max-w-xl flex-1 items-center px-4 pb-10 text-center sm:px-6">
          <div className="space-y-4">
            <p className="text-small font-bold tracking-widest text-white/60 uppercase">Call ended</p>
            <h1 className="text-heading font-extrabold">Thanks for joining</h1>
            <p className="text-body text-white/70">Your call with {who} has ended. Taking you back…</p>
            <div className="flex justify-center pt-2">
              <ButtonLink href={backHref} variant="light" size="sm">
                <ArrowLeft className="size-4" aria-hidden="true" /> Back now
              </ButtonLink>
            </div>
          </div>
        </main>
      </RoomFrame>
    );
  }

  if (!inCall) {
    return (
      <RoomFrame title={title} who={who}>
        <main className="mx-auto grid w-full max-w-xl flex-1 items-center px-4 pb-10 text-center sm:px-6">
          <div className="space-y-4">
            <p className="text-small font-bold tracking-widest text-white/60 uppercase">{ended ? "Session ended" : "You left the call"}</p>
            <h1 className="text-heading font-extrabold">{ended ? "Time’s up. Thank you!" : "You’ve left the session"}</h1>
            <p className="text-body text-white/70">
              {ended
                ? `Your session with ${who} has ended and the call was closed for you.`
                : `The session with ${who} is still running for ${mmss(clock.left)}. You can rejoin.`}
            </p>
            {ended && (
              <p className="text-small text-white/60">
                You can rate the session in My Bookings once it has been finalised, about 15 minutes after the scheduled end. We’ll also send a reminder.
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {!ended && (
                <Button variant="light" size="sm" onClick={() => setLeft(false)}>
                  Rejoin the call
                </Button>
              )}
              <ButtonLink href={backHref} variant={ended ? "light" : "onDark"} size="sm">
                {ended ? <Star className="size-4" aria-hidden="true" /> : <ArrowLeft className="size-4" aria-hidden="true" />}
                {ended ? "Go to My Bookings to rate" : "Back to My Bookings"}
              </ButtonLink>
            </div>
          </div>
        </main>
      </RoomFrame>
    );
  }

  return (
    <RoomFrame title={title} who={who} right={timer}>
      <EndWarning clock={clock} />
      <div className="mt-2 flex flex-col items-center gap-2">
        <ExtendedNote clock={clock} />
        <ExtendButton clock={clock} />
      </div>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-4 sm:px-6">
        <iframe
          title="Video call"
          src={url}
          onLoad={(e) => {
            loads.current += 1;
            console.info("[video frame] load", loads.current, "of", END_LOADS, (e.currentTarget as HTMLIFrameElement).src);
            if (loads.current >= END_LOADS) setOver(true);
          }}
          allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-read; clipboard-write"
          className="mt-3 min-h-[65vh] w-full flex-1 rounded-md bg-black/40 ring-1 ring-white/10"
        />
      </main>
      <footer className="flex items-center justify-center gap-3 bg-black/30 px-4 py-3">
        <Button variant="danger" size="sm" onClick={() => setLeft(true)}>
          <PhoneOff className="size-4" aria-hidden="true" /> Leave call
        </Button>
      </footer>
    </RoomFrame>
  );
}
