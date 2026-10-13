import type { NextConfig } from "next";

// The video call runs in an iframe from the video service (Zoho Meeting, whichever data centre the account is on): the browser only
// hands the camera, microphone and screen share to a frame the page names here.
const VIDEO_HOSTS = ["com", "in", "eu", "com.au", "jp", "sa"].map((d) => `"https://meeting.zoho.${d}"`).concat('"https://meeting.zohocloud.ca"').join(" ");
const allowVideo = (name: string) => `${name}=(self ${VIDEO_HOSTS})`;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: `${allowVideo("camera")}, ${allowVideo("microphone")}, ${allowVideo("display-capture")}, geolocation=()` },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "standalone",
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The reset link carries a secret in its query string: never send it on as a Referer, never cache the page.
      {
        source: "/reset-password",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      { source: "/api/auth/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
