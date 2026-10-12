"use client";

import { useEffect, useRef } from "react";
import { Hourglass, Plus } from "lucide-react";
import { Button } from "@/components/atoms";
import { mmss, type CallClock } from "@/lib/booking/use-call-clock";

/** One soft beep, if the browser allows sound. Never throws: a missing sound must not break the call. */
function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 660;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    osc.onended = () => void ctx.close();
  } catch {
    /* no sound */
  }
}

/**
 * The warning for the last five minutes: a banner with the countdown, one beep when it first appears, and the tab title
 * changing so it shows on the tab bar when the person is looking at the other window.
 */
export function EndWarning({ clock }: { clock: CallClock }) {
  const warned = useRef(false);

  useEffect(() => {
    if (clock.phase === "warn" && !warned.current) {
      warned.current = true;
      beep();
    }
    if (clock.phase === "ok") warned.current = false;      // more time was added: warn again for the new end
  }, [clock.phase]);

  useEffect(() => {
    if (clock.phase === "ok") return;
    const original = document.title;
    document.title = clock.phase === "warn" ? `${mmss(clock.left)} left · GCODE` : "Session ended · GCODE";
    return () => {
      document.title = original;
    };
  }, [clock.phase, clock.left]);

  if (clock.phase === "ok") return null;
  return (
    <div role="alert" className={`mx-auto mt-3 flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-small font-semibold ${clock.phase === "warn" ? "bg-warning text-black" : "bg-danger text-white"}`}>
      <Hourglass className="size-4" aria-hidden="true" />
      {clock.phase === "warn" ? `5 minutes left in this session · ${mmss(clock.left)}` : "The session time is up"}
    </div>
  );
}

/** The expert's button to add 15 minutes (free, twice at most). Shows only while the server says it is allowed; says why when it refuses. */
export function ExtendButton({ clock }: { clock: CallClock }) {
  if (!clock.canExtend && !clock.extendError) return null;
  return (
    <div className="flex flex-col items-center gap-1">
      {clock.canExtend && (
        <Button variant="onDark" size="sm" loading={clock.extending} onClick={() => clock.extend()}>
          <Plus className="size-4" aria-hidden="true" /> Give 15 more minutes
        </Button>
      )}
      {clock.extendError && (
        <p role="alert" className="text-small text-white/80">
          {clock.extendError}
        </p>
      )}
    </div>
  );
}

/** "The session was extended by 15 minutes", for both people, once time has been added. */
export function ExtendedNote({ clock }: { clock: CallClock }) {
  if (clock.extendedMin <= 0) return null;
  return <p className="text-small text-white/70">The expert added {clock.extendedMin} minutes to this session. It costs nothing extra.</p>;
}
