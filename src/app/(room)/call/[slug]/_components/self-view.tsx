"use client";

import { useEffect, useRef } from "react";
import { VideoOff } from "lucide-react";
import { initials } from "@/lib/initials";

/** The person's own camera (mirrored, like every call app) or, when it is off or missing, their initials. */
export function SelfView({ stream, camOn, name, small = false }: { stream: MediaStream | null; camOn: boolean; name: string; small?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream;
  }, [stream, camOn]);

  if (stream && camOn) {
    return <video ref={ref} autoPlay muted playsInline aria-label="Your camera" className="size-full -scale-x-100 rounded-[inherit] object-cover" />;
  }
  return (
    <div className="text-center text-white/80">
      {stream ? (
        <div className={`mx-auto grid place-items-center rounded-full bg-white/15 font-bold ${small ? "text-small size-10" : "text-heading size-24"}`}>{initials(name)}</div>
      ) : (
        <VideoOff className={`mx-auto ${small ? "size-6" : "size-8"}`} aria-hidden="true" />
      )}
      {!small && <p className="text-small mt-2">{stream ? "Camera is off" : "No camera yet"}</p>}
    </div>
  );
}
