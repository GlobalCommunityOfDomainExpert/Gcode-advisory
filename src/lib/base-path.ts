/**
 * The app is served at gcode.in/advisory (proxied from the landing site), so every URL Next.js does not prefix by itself
 * needs this: fetch() to our API, plain <a> links, next/image src, and absolute links we hand to other services.
 * next/link, router.push/replace, redirect() and next.config headers/redirects get it automatically.
 */
export const BASE_PATH = "/advisory";

/** "/api/x" → "/advisory/api/x". Only for paths that start with "/". */
export const withBase = (path: string) => `${BASE_PATH}${path}`;
