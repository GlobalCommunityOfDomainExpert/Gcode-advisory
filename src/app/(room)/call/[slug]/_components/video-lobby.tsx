"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Camera,
  Hourglass,
  Timer,
  Video,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/atoms";
import { RoomFrame, RoomPanel } from "./room-frame";
import { ZohoRoom } from "./zoho-room";
import { EndWarning, ExtendButton, ExtendedNote } from "./end-warning";
import { joinCall } from "@/lib/booking/client";
import { mmss, useCallClock } from "@/lib/booking/use-call-clock";

const MESSAGES: Record<string, string> = {
  not_configured: "Video calls aren’t switched on for this environment yet.",
  busy: "The video service is busy right now. Please try again in a few minutes.",
  failed: "We couldn’t open the video room. Please try again in a minute.",
};
const POLL_MS = 5000;

/**
 * The lobby for a video-service room. No device check of our own (the video service asks for the camera and microphone itself once you are
 * in, so a second check would only ask twice): the session, the time, and one "Join now". The expert's press makes the room. A booker who
 * presses it before the expert has opened the room waits on this screen and is let in by itself the moment the room exists.
 */
export function VideoLobby({
  title,
  who,
  when,
  endAt,
  slug,
  bookingId,
  backHref,
  role,
}: {
  title: string;
  who: string;
  when: string;
  endAt: string;
  slug: string;
  bookingId: number;
  backHref: string;
  role: "expert" | "requester";
}) {
  const clock = useCallClock(slug, endAt, bookingId);
  const [phase, setPhase] = useState<"idle" | "joining" | "waiting">("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const [room, setRoom] = useState<{ url: string; embed: boolean } | null>(
    null,
  );

  /** One try. Returns true when there is nothing more to try (in, or a real problem); false to keep waiting. */
  const attempt = useCallback(async (): Promise<boolean> => {
    const res = await joinCall(slug);
    const answer = res.data;
    if (!res.ok || !answer) {
      setNotice(res.error ?? MESSAGES.failed);
      setPhase("idle");
      return true;
    }
    if (answer.kind === "link") {
      setRoom({ url: answer.url, embed: answer.embed });
      if (!answer.embed)
        window.open(answer.url, "_blank", "noopener,noreferrer");
      return true;
    }
    if (answer.reason === "waiting") {
      setPhase("waiting");
      setNotice(null);
      return false;
    }
    setNotice(MESSAGES[answer.reason] ?? MESSAGES.failed);
    setPhase("idle");
    return true;
  }, [slug]);

  async function start() {
    setPhase("joining");
    setNotice(null);
    await attempt();
  }

  // waiting for the expert: ask again every few seconds until the room exists (or the session's time is up)
  useEffect(() => {
    if (phase !== "waiting" || room || clock.phase === "ended") return;
    let alive = true;
    const t = setInterval(async () => {
      if (!alive) return;
      if (await attempt()) clearInterval(t);
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [phase, room, clock.phase, attempt]);

  if (room?.embed)
    return (
      <ZohoRoom
        title={title}
        who={who}
        url={room.url}
        endAt={endAt}
        slug={slug}
        bookingId={bookingId}
        backHref={backHref}
      />
    );

  // an ordinary link (no embedding possible): it opened in its own tab; this page stays as the session's clock
  if (room) {
    return (
      <RoomFrame title={title} who={who}>
        <RoomPanel>
          <p className="text-small font-bold tracking-widest text-white/60 uppercase">
            {clock.phase === "ended" ? "Session ended" : "In your session"}
          </p>
          <p
            role="timer"
            aria-label="Time left"
            className="text-[4rem] leading-none font-extrabold tabular-nums"
          >
            {clock.phase === "ended" ? "0:00" : mmss(clock.left)}
          </p>
          <p className="text-body text-white/70">
            {clock.phase === "ended"
              ? "The scheduled time is up."
              : `with ${who} · the call is open in another tab. This clock keeps the time.`}
          </p>
          <EndWarning clock={clock} />
          <ExtendedNote clock={clock} />
          <ExtendButton clock={clock} />
          <div className="flex flex-wrap gap-3 pt-2">
            {clock.phase !== "ended" && (
              <ButtonLink
                href={room.url}
                variant="onDark"
                size="sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the call
              </ButtonLink>
            )}
            <ButtonLink
              href={backHref}
              variant={clock.phase === "ended" ? "light" : "onDark"}
              size="sm"
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> Back to My
              Bookings
            </ButtonLink>
          </div>
        </RoomPanel>
      </RoomFrame>
    );
  }

  return (
    <RoomFrame title={title} who={who}>
      <RoomPanel>
        {phase === "waiting" ? (
          <div role="status" className="space-y-4">
            <span className="grid size-12 place-items-center rounded-full bg-white/10">
              <Hourglass className="size-5 animate-pulse" aria-hidden="true" />
            </span>
            <p className="text-small font-bold tracking-widest text-white/60 uppercase">
              Waiting for the expert
            </p>
            <h1 className="text-heading font-extrabold">
              Waiting for {who} to open the room
            </h1>
            <p className="text-body text-white/70">
              You’ll be let in automatically the moment they do. You can leave
              this page open.
            </p>
            <p className="text-small text-white/60">
              {title} · {when}
            </p>
            <p
              role="timer"
              aria-label="Time left"
              className="text-small text-white/70 tabular-nums"
            >
              {clock.phase === "ended"
                ? "The session’s time is up."
                : `${mmss(clock.left)} left in this session`}
            </p>
          </div>
        ) : (
          <>
            <p className="text-small font-bold tracking-widest text-white/60 uppercase">
              Ready to join?
            </p>
            <h1 className="text-heading font-extrabold">{title}</h1>
            <p className="text-body text-white/70">with {who}</p>
            <ul className="text-small divide-y divide-white/10 rounded-lg border border-white/10 bg-white/5">
              <li className="flex items-center gap-3 px-4 py-3">
                <CalendarClock
                  className="size-4 shrink-0 text-white/60"
                  aria-hidden="true"
                />
                <span className="text-white/60">When</span>
                <span className="ml-auto text-right font-medium">{when}</span>
              </li>
              <li className="flex items-center gap-3 px-4 py-3">
                <Timer
                  className="size-4 shrink-0 text-white/60"
                  aria-hidden="true"
                />
                <span className="text-white/60">Time left</span>
                <span
                  role="timer"
                  aria-label="Time left"
                  className="ml-auto font-medium tabular-nums"
                >
                  {clock.phase === "ended" ? "Time is up" : mmss(clock.left)}
                </span>
              </li>
              <li className="flex items-center gap-3 px-4 py-3">
                <Camera
                  className="size-4 shrink-0 text-white/60"
                  aria-hidden="true"
                />
                <span className="text-white/60">Camera and mic</span>
                <span className="ml-auto text-right font-medium">
                  Asked once you’re in
                </span>
              </li>
            </ul>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                variant="light"
                loading={phase === "joining"}
                onClick={start}
              >
                <Video className="size-4" aria-hidden="true" /> Join now
              </Button>
              <ButtonLink href={backHref} variant="onDark" size="sm">
                <ArrowLeft className="size-4" aria-hidden="true" /> Back to My
                Bookings
              </ButtonLink>
            </div>
            {role === "requester" && (
              <p className="text-small text-white/60">
                If {who} hasn’t arrived yet, you’ll wait here and be let in when
                they do.
              </p>
            )}
            {notice && (
              <p role="status" className="text-small text-white">
                {notice}
              </p>
            )}
          </>
        )}
        {phase === "waiting" && (
          <div>
            <ButtonLink href={backHref} variant="onDark" size="sm">
              <ArrowLeft className="size-4" aria-hidden="true" /> Back to My
              Bookings
            </ButtonLink>
          </div>
        )}
      </RoomPanel>
    </RoomFrame>
  );
}
