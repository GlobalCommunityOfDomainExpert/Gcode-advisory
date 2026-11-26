"use client";

import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { RoundButton } from "./round-button";
import { SelfView } from "./self-view";
import type { useLocalMedia } from "@/lib/booking/use-local-media";

/**
 * The camera and microphone check shown before the call: your own picture, the two switches and the microphone level. The choices made here
 * carry no further than this page (Prebuilt starts with the camera and microphone on), so a person who switched one off here can switch it off
 * again inside the room. The devices are released the moment the room opens, so the room itself can use them.
 */
export function DeviceCheck({ media, name }: { media: ReturnType<typeof useLocalMedia>; name: string }) {
  return (
    <div>
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded-md bg-black/35 ring-1 ring-white/10">
        <SelfView stream={media.stream} camOn={media.cam} name={name} />
        {media.status === "asking" && (
          <p className="text-small absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1">Allow camera and microphone to check them</p>
        )}
        {(media.status === "blocked" || media.status === "unsupported") && (
          <p className="text-small absolute inset-x-3 bottom-3 rounded-md bg-black/60 px-3 py-2 text-center" role="status">
            {media.status === "blocked"
              ? "Your browser is blocking the camera and microphone. Allow them from the address bar, then reload. You can still join."
              : "This browser can’t check your camera and microphone. You can still join."}
          </p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <RoundButton on={media.mic} iconOn={Mic} iconOff={MicOff} label="Microphone" onClick={media.toggleMic} disabled={media.status !== "ready"} />
        <RoundButton on={media.cam} iconOn={Video} iconOff={VideoOff} label="Camera" onClick={media.toggleCam} disabled={!media.hasVideo} />
      </div>
      <div
        className="mx-auto mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-white/15"
        role="meter"
        aria-label="Microphone level"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(media.level * 100)}
      >
        <div className="h-full rounded-full bg-white/80 transition-[width] duration-75" style={{ width: `${Math.round(media.level * 100)}%` }} />
      </div>
    </div>
  );
}
