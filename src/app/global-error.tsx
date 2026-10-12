"use client";

import { useEffect } from "react";

/**
 * The last resort: the root layout itself failed, so nothing from the app (styles, fonts, components) can be relied on. This replaces
 * the whole document, which is why it carries its own <html>, <body> and inline styles in the app's navy and red. Same idea as the
 * app's own error page: the ring mark, plain words, one button, sitting on the page rather than in a box.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", background: "#f5f5f5", color: "#211f1c" }}>
        <main role="alert" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1rem", textAlign: "center" }}>
          <div style={{ maxWidth: "30rem" }}>
            <div
              style={{
                margin: "0 auto",
                width: "5rem",
                height: "5rem",
                borderRadius: "50%",
                border: "0.6rem solid #e60000",
                display: "grid",
                placeItems: "center",
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "#1b3041",
              }}
            >
              !
            </div>
            <h1 style={{ fontSize: "2rem", margin: "1.75rem 0 0.6rem", fontWeight: 800, letterSpacing: "-0.01em" }}>Something went wrong</h1>
            <p style={{ margin: "0 0 1.75rem", color: "#5a6672", lineHeight: 1.6 }}>
              GCODE could not start this page. Your account, bookings and payments are safe. Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => retry()}
              style={{ background: "#1b3041", color: "#fff", border: 0, borderRadius: "6px", padding: "0.8rem 1.6rem", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}
            >
              Try again
            </button>
            {error.digest && (
              <p style={{ margin: "1.75rem 0 0", fontSize: "0.85rem", color: "#5a6672" }}>
                Reference <span style={{ fontFamily: "ui-monospace, Consolas, monospace", fontWeight: 600, color: "#211f1c" }}>{error.digest}</span>
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
