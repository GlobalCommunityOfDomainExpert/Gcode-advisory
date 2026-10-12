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
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", background: "#f5f5f5", color: "#211f1c" }}>
        <main role="alert" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1rem" }}>
          <div style={{ width: "100%", maxWidth: "30rem", background: "#fff", border: "1px solid #1a2f3f14", borderRadius: "18px", overflow: "hidden", boxShadow: "0 16px 40px #1a2f3f14" }}>
            <div style={{ background: "linear-gradient(135deg, #1b3041, #234157)", padding: "2rem 1.5rem", textAlign: "center", color: "#fff" }}>
              <div style={{ margin: "0 auto", width: "4.5rem", height: "4.5rem", borderRadius: "50%", border: "0.5rem solid #e60000", display: "grid", placeItems: "center", fontSize: "2rem", fontWeight: 800 }}>!</div>
              <p style={{ margin: "1rem 0 0", fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75 }}>GCODE</p>
            </div>
            <div style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
              <h1 style={{ fontSize: "1.6rem", margin: "0 0 0.6rem", fontWeight: 800, letterSpacing: "-0.01em" }}>Something went wrong</h1>
              <p style={{ margin: "0 0 1.5rem", color: "#5a6672", lineHeight: 1.6 }}>
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
                <p style={{ margin: "1.5rem 0 0", fontSize: "0.85rem", color: "#5a6672" }}>
                  Reference: <span style={{ fontFamily: "ui-monospace, Consolas, monospace", fontWeight: 600, color: "#211f1c" }}>{error.digest}</span>
                </p>
              )}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
