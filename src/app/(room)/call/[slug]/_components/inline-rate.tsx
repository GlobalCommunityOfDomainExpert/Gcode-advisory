"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button, Textarea } from "@/components/atoms";
import { StarPicker } from "@/components/domain";
import { rateBooking } from "@/lib/booking/client";

const RETRY_MS = 60_000;
const RETRIES = 20;
const NOT_YET = /once it is completed/i;
const DONE_ALREADY = /already rated/i;

/**
 * Rating on the "session ended" page, so nobody has to go looking for it. The backend only takes a rating once the session is
 * finalised (about 15 minutes after the scheduled end, when attendance is settled). So the person can fill it in right now: if it is
 * too early we keep their stars and comment, say so, and send it ourselves (once a minute, while this page stays open). If they leave
 * the page first, the same rating can still be given later from My Bookings.
 */
export function InlineRate({
  bookingId,
  role,
}: {
  bookingId: number;
  role: "expert" | "requester";
}) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "waiting" | "done">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const tries = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => void (timer.current && clearTimeout(timer.current)),
    [],
  );

  async function send() {
    const res = await rateBooking(bookingId, {
      stars,
      comment: comment.trim(),
    });
    if (res.ok || DONE_ALREADY.test(res.error ?? "")) {
      setState("done");
      return;
    }
    if (NOT_YET.test(res.error ?? "") && tries.current < RETRIES) {
      tries.current += 1;
      setState("waiting");
      timer.current = setTimeout(send, RETRY_MS);
      return;
    }
    setError(res.error ?? "Something went wrong.");
    setState("idle");
  }

  function submit() {
    if (stars === 0 || state === "busy" || state === "waiting") return;
    setError(null);
    setState("busy");
    tries.current = 0;
    void send();
  }

  if (state === "done") {
    return (
      <div
        role="status"
        className="text-body flex items-center gap-2 text-white"
      >
        <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" /> Thanks
        for your feedback.
      </div>
    );
  }

  return (
    <div className="text-text-primary space-y-3 rounded-lg bg-white p-4">
      <p className="text-body font-semibold">How was the session?</p>
      <p className="text-small text-text-secondary">
        {role === "requester"
          ? "Your rating and comment are shown on the expert’s profile."
          : "Your rating is private: only GCODE sees it."}
      </p>
      <StarPicker value={stars} onChange={setStars} />
      <div>
        <label
          htmlFor="inline-rate-comment"
          className="text-small mb-1 block font-semibold"
        >
          Add a comment (optional)
        </label>
        <Textarea
          id="inline-rate-comment"
          rows={3}
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={state === "waiting"}
        />
      </div>
      {state === "waiting" && (
        <p role="status" className="text-small text-text-secondary">
          Saved. We’ll send it as soon as the session is finalised, about 15
          minutes after the scheduled end. Keep this page open, or rate it later
          from My Bookings.
        </p>
      )}
      {error && (
        <p role="alert" className="text-small text-danger">
          {error}
        </p>
      )}
      <Button
        size="sm"
        loading={state === "busy"}
        disabled={stars === 0 || state === "waiting"}
        onClick={submit}
      >
        Submit rating
      </Button>
    </div>
  );
}
