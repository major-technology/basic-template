"use client";

import { useReportError } from "@major-tech/error-reporter/next";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useReportError(error);

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            Something went wrong
          </h2>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              backgroundColor: "#171717",
              color: "#fff",
              fontSize: "0.875rem",
              cursor: "pointer",
              border: "none",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
