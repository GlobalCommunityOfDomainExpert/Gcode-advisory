import { ords } from "./ords";
import { summarizeParticipants, zoho, type Zoho } from "./zoho";

/**
 * Fetches the video vendor's report for one ended session and hands it to the database, which settles the booking
 * (ATTENDED or a no-show) on its next sweep. Both roles are always reported, with 0 seconds when nobody of that role came.
 * Returns true when the report was delivered.
 */
export async function syncAttendance(bookingId: number | string, room: string, token?: string, client: Zoho | null = zoho()): Promise<boolean> {
  const serverKey = process.env.MEETING_SERVER_KEY;
  if (!client || !serverKey) return false;
  try {
    const summary = summarizeParticipants(await client.getParticipants(room));
    const res = await ords<{ ok: boolean }>(`/bookings/${bookingId}/attendance`, { body: summary, headers: { "X-Server-Key": serverKey }, token });
    return res.ok;
  } catch {
    return false;
  }
}

/** The sessions a scheduled job should look at: ended, video-vendor, no report yet. */
export async function pendingAttendance(): Promise<{ bookingId: number; room: string }[] | null> {
  const serverKey = process.env.MEETING_SERVER_KEY;
  if (!serverKey) return null;
  const res = await ords<{ bookingId: number; room: string }[]>("/bookings/pending-attendance", { headers: { "X-Server-Key": serverKey } });
  return res.ok ? res.data : null;
}
