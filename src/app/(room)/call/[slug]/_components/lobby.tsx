"use client";

import { useState } from "react";
import { ArrowLeft, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Button, ButtonLink } from "@/components/atoms";
import { RoomFrame } from "./room-frame";
import { RoundButton } from "./round-button";
import { SelfView } from "./self-view";
import { useLocalMedia } from "@/lib/booking/use-local-media";
import { joinCall } from "@/lib/booking/client";
import { mmss, useCallClock } from "@/lib/booking/use-call-clock";
import { EndWarning, ExtendButton, ExtendedNote } from "./end-warning";
import { ZohoRoom } from "./zoho-room";
import type { CallLink } from "@/lib/server/meeting";

const UNAVAILABLE: Record<string, string> = {
  not_configured: "Video calls aren’t switched on for this environment yet.",
  busy: "The video service is busy right now. Please try again in a few minutes.",
  failed: "We couldn’t open the video room. Please try again in a minute.",
  waiting: "The expert hasn’t opened the room yet. Try again in a moment.",
};

/**
 * The lobby from the wireframe: your own camera and microphone first (so you know they work), the session on the right, and
 * one big "Join now". Your devices are released the moment you leave for the call so the call itself can use them.
 */
export function Lobby({
  title,
  who,
  when,
  endAt,
  slug,
  bookingId,
  name,
  backHref,
  call,
}: {
  title: string;
  who: string;
  when: string;
  /** The scheduled end (ISO), for the countdown and the five-minute warning. */
  endAt: string;
  slug: string;
  bookingId: number;
  /** The signed-in person, for the initials shown while the camera is off. */
  name: string;
  backHref: string;
  call: CallLink;
}) {
  const media = useLocalMedia();
  const clock = useCallClock(slug, endAt, bookingId);
  // the call itself opens in the video service's own tab; this tab stays behind as the session's clock
  const [joined, setJoined] = useState(false);
  // a video-service room is made or found when "Join now" is pressed; `active` is what came back
  const [active, setActive] = useState<CallLink | null>(null);
  const [joining, setJoining] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const room: CallLink = active ?? call;

  async function joinNow() {
    setJoining(true);
    setNotice(null);
    const res = await joinCall(slug);
    setJoining(false);
    const answer = res.data;
    if (!res.ok || !answer) return setNotice(res.error ?? UNAVAILABLE.failed);
    if (answer.kind !== "link") return setNotice(UNAVAILABLE[answer.reason]);
    media.stop();
    setActive({ kind: "link", url: answer.url, external: answer.external, embed: answer.embed });
    setJoined(true);
    if (!answer.embed) window.open(answer.url, "_blank", "noopener,noreferrer");
  }

  // the video service's room is shown inside this page (with the clock, the warning and the end of the session)
  if (joined && room.kind === "link" && room.embed) {
    return <ZohoRoom title={title} who={who} url={room.url} endAt={endAt} slug={slug} bookingId={bookingId} backHref={backHref} />;
  }

  if (joined && room.kind === "link") {
    return (
      <RoomFrame title={title} who={who}>
        <main className="mx-auto grid w-full max-w-xl flex-1 items-center px-4 pb-10 text-center sm:px-6">
          <div className="space-y-4">
            <p className="text-small font-bold tracking-widest text-white/60 uppercase">{clock.phase === "ended" ? "Session ended" : "In your session"}</p>
            <p role="timer" aria-label="Time left" className="text-[4rem] leading-none font-extrabold tabular-nums">
              {clock.phase === "ended" ? "0:00" : mmss(clock.left)}
            </p>
            <p className="text-body text-white/70">
              {clock.phase === "ended" ? "The scheduled time is up. Leave the call tab if it is still open." : `with ${who} · the call is open in another tab. This clock keeps the time.`}
            </p>
            <EndWarning clock={clock} />
            <ExtendedNote clock={clock} />
            <ExtendButton clock={clock} />
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {clock.phase !== "ended" && (
                <ButtonLink href={room.url} variant="onDark" size="sm" target="_blank" rel="noopener noreferrer">
                  Reopen the call
                </ButtonLink>
              )}
              <ButtonLink href={backHref} variant={clock.phase === "ended" ? "light" : "onDark"} size="sm">
                <ArrowLeft className="size-4" aria-hidden="true" /> Back to My Bookings
              </ButtonLink>
            </div>
          </div>
        </main>
      </RoomFrame>
    );
  }

  return (
    <RoomFrame title={title} who={who}>
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="relative grid aspect-video place-items-center overflow-hidden rounded-md bg-black/35 ring-1 ring-white/10">
            <SelfView stream={media.stream} camOn={media.cam} name={name} />
            {media.status === "asking" && <p className="text-small absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1">Allow camera and microphone to check them</p>}
            {(media.status === "blocked" || media.status === "unsupported") && (
              <p className="text-small absolute inset-x-3 bottom-3 rounded-md bg-black/60 px-3 py-2 text-center" role="status">
                {media.status === "blocked"
                  ? "Your browser is blocking the camera and microphone. Allow them from the address bar, then reload. You can still join."
                  : "This browser can’t check your camera and microphone. You can still join."}
              </p>
            )}
          </div>
          <div className="mt-5 flex items-center justify-center gap-3">
            <RoundButton on={media.mic} iconOn={Mic} iconOff={MicOff} label="Microphone" onClick={media.toggleMic} disabled={media.status !== "ready"} />
            <RoundButton on={media.cam} iconOn={Video} iconOff={VideoOff} label="Camera" onClick={media.toggleCam} disabled={!media.hasVideo} />
          </div>
          <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-white/15" role="meter" aria-label="Microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(media.level * 100)}>
            <div className="h-full rounded-full bg-white/80 transition-[width] duration-75" style={{ width: `${Math.round(media.level * 100)}%` }} />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-small font-bold tracking-widest text-white/60 uppercase">Ready to join?</p>
            <h1 className="text-heading mt-1 font-extrabold">{title}</h1>
            <p className="text-body mt-1 text-white/70">with {who}</p>
            <p className="text-small mt-1 text-white/60">{when}</p>
          </div>

          {call.kind === "join" ? (
            <div className="space-y-3">
              <Button variant="light" className="w-full" loading={joining} onClick={joinNow}>
                <Video className="size-4" aria-hidden="true" /> Join now
              </Button>
              {notice && (
                <p role="status" className="text-small text-white">
                  {notice}
                </p>
              )}
            </div>
          ) : call.kind === "link" && call.embed ? (
            <Button
              variant="light"
              className="w-full"
              onClick={() => {
                media.stop();
                setJoined(true);
              }}
            >
              <Video className="size-4" aria-hidden="true" /> Join now
            </Button>
          ) : call.kind === "link" ? (
            <ButtonLink
              href={call.url}
              variant="light"
              className="w-full"
              onClick={() => {
                media.stop();
                setJoined(true);
              }}
              {...(call.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <Video className="size-4" aria-hidden="true" /> Join now
            </ButtonLink>
          ) : (
            <div className="space-y-3" role="status">
              <p className="text-body text-white">{UNAVAILABLE[call.reason]}</p>
              <Button variant="light" className="w-full" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          )}

          <p className="text-small text-white/60">Check that your camera and microphone work. You can change them once you’re in the room.</p>
          <ButtonLink href={backHref} variant="onDark" size="sm" onClick={media.stop}>
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to My Bookings
          </ButtonLink>
        </div>
      </main>
    </RoomFrame>
  );
}
