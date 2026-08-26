"use client";

/**
 * Global error boundary. Replaces the root layout when it itself fails,
 * so it must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          background: "#0A0A0B",
          color: "#FAFAFA",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div style={{ maxWidth: 400, textAlign: "center" }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 20,
              }}
            >
              An unexpected error occurred. You can retry — if it keeps happening,
              please contact support.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#6366F1",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
