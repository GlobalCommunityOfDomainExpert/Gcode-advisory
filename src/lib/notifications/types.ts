/** What the bell gets from GET /api/notifications (db/F1-03 GCODE_NOTIFY_API.list_json). */
export interface NotificationItem {
  id: number;
  /** REQUEST_SENT, NEW_REQUEST, ACCEPTED, DECLINED, CANCELLED_BY_*, EXPIRED*, REMINDER_24H_*, REMINDER_10M_* ... */
  type: string;
  title: string;
  /** The first line of the message, no greeting, at most 140 characters. */
  text: string;
  /** A path inside the app, for example /bookings or /call/abc-defg-hij. */
  link: string;
  /** ISO instant, UTC. */
  createdAt: string;
  unread: boolean;
}

export interface NotificationList {
  items: NotificationItem[];
  unread: number;
}

/** The person's notification settings (db/F1-03 GCODE_NOTIFY_API.prefs_json). Quiet hours are IST, "HH:MM". */
export interface NotificationPrefs {
  emailOn: boolean;
  inAppOn: boolean;
  quietOn: boolean;
  quietFrom: string;
  quietTo: string;
}
