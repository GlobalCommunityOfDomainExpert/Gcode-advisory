"use client";

import { useMemo } from "react";
import { ZohoRoom } from "./zoho-room";

// Same Prebuilt version and options as GCODE Events. Pinned on purpose. The trailing slash is required: without it the host answers 302
// and drops the whole query string (token, meetingId, name), and Prebuilt then fails with error 4001.
const PREBUILT_URL = "https://embed.videosdk.live/rtc-js-prebuilt/0.3.43/";

/**
 * Prebuilt's options, as its embed page reads them from the query string. Advisory logic: it is a 1:1 paid session, so there is no stage,
 * no polls, no recording or streaming (those stay off: nothing here may start them), and no way for the booker to end the session. The
 * expert is the host and may mute or remove the other person; both may share their screen and chat. The clock, the five-minute warning,
 * "+15 min" and the end of the session belong to OUR page around the frame, not to the video room.
 */
function roomOptions(role: "expert" | "requester", origin: string): Record<string, string> {
  const host = role === "expert";
  return {
    theme: "DARK",
    language: "en",
    brandingEnabled: "true",
    brandName: "GCODE Advisory",
    brandLogoURL: `${origin}/apple-icon.png`,
    poweredBy: "false",
    topbarEnabled: "true",
    layoutType: "GRID",
    layoutPriority: "SPEAKER",
    maintainVideoAspectRatio: "true",
    waitingScreenText: "Connecting you to the session...",
    // The call page's own "Join now" was the decision to join: skip Prebuilt's join screen.
    joinScreenEnabled: "false",
    joinWithoutUserInteraction: "true",
    askJoin: "false",
    micEnabled: "true",
    webcamEnabled: "true",
    chatEnabled: "true",
    raiseHandEnabled: "false",
    pollEnabled: "false",
    participantTabPanelEnabled: "true",
    moreOptionsEnabled: "true",
    participantCanLeave: "true",
    participantCanToggleSelfMic: "true",
    participantCanToggleSelfWebcam: "true",
    screenShareEnabled: "true",
    canPin: "true",
    canChangeLayout: "true",
    canCreatePoll: "false",
    canToggleVirtualBackground: "true",
    whiteboardEnabled: "false",
    participantCanToggleOtherMic: String(host),
    participantCanToggleOtherWebcam: String(host),
    partcipantCanToogleOtherScreenShare: String(host),
    canRemoveOtherParticipant: String(host),
    // Ours: the server and the clock decide when the session ends
    participantCanEndMeeting: "false",
    recordingEnabled: "false",
    participantCanToggleRecording: "false",
    participantCanToggleHls: "false",
    liveStreamEnabled: "false",
    hlsEnabled: "false",
    maxResolution: "hd",
  };
}

/**
 * The advisory session in VideoSDK's Prebuilt room. The URL carries a token our server made for this person (room id and
 * "<bookingId>-<role>" as participant id), so nobody joins without a booking. It reuses the session shell of the Zoho room (clock,
 * warnings, +15 min, "you left" and "time's up" pages). On leave Prebuilt is sent to /call-left.html, a blank page of ours, and that
 * second load of the frame is how the shell knows the person left.
 */
export function VideoSdkRoom({
  token,
  roomId,
  name,
  ...rest
}: {
  token: string;
  roomId: string;
  name: string;
  title: string;
  who: string;
  endAt: string;
  slug: string;
  bookingId: number;
  backHref: string;
  role: "expert" | "requester";
}) {
  const url = useMemo(() => {
    const origin = window.location.origin;
    const q = new URLSearchParams({
      token,
      meetingId: roomId,
      name,
      redirectOnLeave: `${origin}/call-left.html`,
      ...roomOptions(rest.role, origin),
    });
    return `${PREBUILT_URL}?${q}`;
  }, [token, roomId, name, rest.role]);
  return <ZohoRoom {...rest} url={url} endLoads={2} />;
}
