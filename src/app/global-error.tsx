"use client";

import { useEffect } from "react";

/**
 * The last resort: the root layout itself failed, so nothing from the app (styles, fonts, components) can be relied on. This replaces
 * the whole document, which is why it carries its own <html>, <body> and inline styles in the app's navy. Plain words, one button.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", background: "#f5f5f5", color: "#1b3041" }}>
        <main role="alert" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1rem" }}>
          <div style={{ maxWidth: "26rem", textAlign: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "2.5rem 1.5rem" }}>
            <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>Something went wrong</h1>
            <p style={{ margin: "0 0 1.25rem", color: "#4b5563", lineHeight: 1.5 }}>
              GCODE could not start this page. Your account, bookings and payments are safe. Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={() => retry()}
              style={{ background: "#1b3041", color: "#fff", border: 0, borderRadius: "0.25rem", padding: "0.7rem 1.4rem", fontWeight: 700, cursor: "pointer" }}
            >
              Try again
            </button>
            {error.digest && <p style={{ margin: "1rem 0 0", fontSize: "0.8rem", color: "#6b7280" }}>Reference: {error.digest}</p>}
          </div>
        </main>
      </body>
    </html>
  );
}
