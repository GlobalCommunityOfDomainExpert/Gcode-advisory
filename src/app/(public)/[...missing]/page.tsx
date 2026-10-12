import { notFound } from "next/navigation";

/**
 * Catches every address no other route owns, so an unknown link is answered with the 404 screen inside the right frame (the app
 * frame when signed in, the guest frame when signed out) and an HTTP 404. Real routes always win over a catch-all.
 */
export default function Missing(): never {
  notFound();
}
