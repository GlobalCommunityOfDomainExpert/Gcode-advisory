"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MediaStatus = "asking" | "ready" | "blocked" | "unsupported";

/**
 * The person's own camera and microphone, for the lobby check and the self tile. Asks once on mount, toggles by switching
 * tracks on and off (the devices stay open), reports a 0-1 microphone level, and releases everything on unmount or `stop()`.
 */
export function useLocalMedia() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<MediaStatus>("asking");
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [level, setLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const stopMeter = useRef<() => void>(() => {});

  const stop = useCallback(() => {
    stopMeter.current();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }
      let s: MediaStream;
      try {
        s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        try {
          s = await navigator.mediaDevices.getUserMedia({ audio: true });   // no camera, or it was refused: sound only
          if (!cancelled) setCam(false);
        } catch {
          if (!cancelled) setStatus("blocked");
          return;
        }
      }
      if (cancelled) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = s;
      setStream(s);
      setStatus("ready");

      // microphone level meter
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx && s.getAudioTracks().length) {
        const ctx = new Ctx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(s).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        let raf = 0;
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setLevel(Math.min(1, avg / 90));
          raf = requestAnimationFrame(tick);
        };
        tick();
        stopMeter.current = () => {
          cancelAnimationFrame(raf);
          void ctx.close().catch(() => {});
        };
      }
    })();
    return () => {
      cancelled = true;
      stop();
    };
  }, [stop]);

  useEffect(() => {
    stream?.getAudioTracks().forEach((t) => (t.enabled = mic));
  }, [stream, mic]);
  useEffect(() => {
    stream?.getVideoTracks().forEach((t) => (t.enabled = cam));
  }, [stream, cam]);

  const hasVideo = !!stream?.getVideoTracks().length;
  return { stream, status, mic, cam: cam && hasVideo, hasVideo, level: mic ? level : 0, toggleMic: () => setMic((v) => !v), toggleCam: () => setCam((v) => !v), stop };
}
