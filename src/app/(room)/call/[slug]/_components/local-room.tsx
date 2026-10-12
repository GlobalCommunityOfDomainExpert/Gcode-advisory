"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, MessageSquare, MonitorUp, PhoneOff, Video, VideoOff } from "lucide-react";
import { ButtonLink } from "@/components/atoms";
import { RoomFrame } from "./room-frame";
import { RoundButton } from "./round-button";
import { SelfView } from "./self-view";
import { useLocalMedia } from "@/lib/booking/use-local-media";
import { initials } from "@/lib/initials";

const clock = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");

/**
 * The in-call screen from the wireframe, for the LOCAL provider: the other person's tile, your own small tile, a running
 * clock and the control bar. No audio or video is sent anywhere; it stands in for the real video provider so the flow can
 * be tried without an account. Your own camera and microphone are real, so the toggles do something.
 */
export function LocalRoom({ title, who, name, leaveHref }: { title: string; who: string; name: string; leaveHref: string }) {
  const media = useLocalMedia();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const timer = (
    <span className="text-small inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium text-white tabular-nums" role="timer" aria-label="Time in the call">
      <span className="bg-danger size-2 animate-pulse rounded-full" aria-hidden="true" />
      {clock(seconds)}
    </span>
  );

  return (
    <RoomFrame title={title} who={who} right={timer}>
      <main className="relative mx-auto grid w-full max-w-6xl flex-1 place-items-center px-4 pb-28 sm:px-6">
        <div className="grid aspect-video w-full place-items-center rounded-md bg-black/35 ring-1 ring-white/10">
          <div className="text-center">
            <div className="text-heading mx-auto grid size-28 place-items-center rounded-full bg-white/15 font-bold">{initials(who)}</div>
            <p className="text-body mt-3 font-semibold">{who}</p>
            <p className="text-small mt-1 text-white/60">Test room: no video is sent</p>
          </div>
        </div>
        <div className="absolute right-6 bottom-32 grid aspect-video w-36 place-items-center overflow-hidden rounded-md bg-black/60 ring-1 ring-white/20 sm:w-48">
          <SelfView stream={media.stream} camOn={media.cam} name={name} small />
          <span className="text-small absolute bottom-1.5 left-2 text-white/80">You</span>
        </div>
      </main>
      <footer className="fixed inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-black/30 px-4 py-4">
        <RoundButton on={media.mic} iconOn={Mic} iconOff={MicOff} label="Microphone" onClick={media.toggleMic} disabled={media.status !== "ready"} />
        <RoundButton on={media.cam} iconOn={Video} iconOff={VideoOff} label="Camera" onClick={media.toggleCam} disabled={!media.hasVideo} />
        <RoundButton on iconOn={MonitorUp} iconOff={MonitorUp} label="Share screen" disabled />
        <RoundButton on iconOn={MessageSquare} iconOff={MessageSquare} label="Chat" disabled />
        <ButtonLink href={leaveHref} variant="danger" onClick={media.stop}>
          <PhoneOff className="size-4" aria-hidden="true" /> Leave
        </ButtonLink>
      </footer>
    </RoomFrame>
  );
}
