import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ButtonLink } from "@/components/atoms";
import { ords } from "@/lib/server/ords";
import { getSession } from "@/lib/server/session";
import { previewCall, resolveCall } from "@/lib/server/meeting";
import { syncAttendance } from "@/lib/server/attendance";
import type { JoinInfo } from "@/lib/booking/types";
import { fmtDayLong, fmtTime } from "@/lib/booking/time";
import { Lobby } from "./_components/lobby";
import { OpensIn } from "./_components/opens-in";
import { RoomFrame } from "./_components/room-frame";

export const metadata: Metadata = { title: "Join call" };

const SLUG = /^[a-z0-9-]{8,20}$/;

/** A message in the dark room: not open yet, ended, not confirmed, or could not load. */
function Notice({ title, who, children }: { title: string; who: string; children: React.ReactNode }) {
  return (
    <RoomFrame title={title} who={who}>
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center px-4 pb-10 sm:px-6">
        <div className="max-w-xl space-y-4">{children}</div>
      </main>
    </RoomFrame>
  );
}

/**
 * The only door to a session: /call/<slug>. The backend decides who may enter and when (a stranger or a wrong slug is a plain
 * 404); this page shows the answer in the room's own full-screen look. Vendor links are never emailed: reminders point here,
 * and the room link appears only while the room is open.
 */
export default async function CallPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const { slug: raw } = await params;
  const slug = raw.toLowerCase();
  if (!SLUG.test(slug)) notFound();

  const res = await ords<JoinInfo>(`/bookings/call/${slug}`, { token: session.token });
  if (!res.ok) {
    if (res.status === 404) notFound();
    if (res.status === 409) {
      return (
        <Notice title="Session" who="">
          <h1 className="text-heading font-extrabold">This session isn’t confirmed</h1>
          <p className="text-body text-white/70">You can join once the expert has accepted the request.</p>
          <ButtonLink href="/bookings" variant="light">Back to My bookings</ButtonLink>
        </Notice>
      );
    }
    return (
      <Notice title="Session" who="">
        <h1 className="text-heading font-extrabold">We couldn’t open this session</h1>
        <p className="text-body text-white/70">Please refresh the page in a moment.</p>
      </Notice>
    );
  }

  const info = res.data;
  const when = `${fmtDayLong(info.startAt)} · ${fmtTime(info.startAt)} to ${fmtTime(info.endAt)}`;

  if (info.state === "EARLY") {
    return (
      <Notice title={info.serviceTitle} who={info.otherName}>
        <OpensIn opensAt={info.opensAt} />
        <p className="text-small text-white/60">{when}</p>
        <ButtonLink href="/bookings" variant="onDark" size="sm">Back to My Bookings</ButtonLink>
      </Notice>
    );
  }

  if (info.state === "ENDED") {
    // The room has closed but the session is not settled: pull the video vendor's attendance report now rather than wait for the job.
    if (info.provider === "ZOHO" && info.room && !info.settled) await syncAttendance(info.bookingId, info.room, session.token);
    return (
      <Notice title={info.serviceTitle} who={info.otherName}>
        <p className="text-small font-bold tracking-widest text-white/60 uppercase">Session ended</p>
        <h1 className="text-heading font-extrabold">This session has ended</h1>
        <p className="text-body text-white/70">The room closed 15 minutes after the scheduled end.</p>
        <ButtonLink href="/bookings" variant="light">Back to My Bookings</ButtonLink>
      </Notice>
    );
  }

  // a video-service room is made (or looked up) when "Join now" is pressed; the stand-in room is already there
  const call = previewCall(info) ?? (await resolveCall(session.token, info));
  return <Lobby title={info.serviceTitle} who={info.otherName} when={when} endAt={info.endAt} slug={info.slug} bookingId={info.bookingId} name={session.fullName || "You"} backHref="/bookings" call={call} />;
}
