"use client";

import { useReportError } from "@major-tech/error-reporter/next";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useReportError(error);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <button
        onClick={reset}
        className="rounded-md bg-foreground px-4 py-2 text-sm text-background transition-colors hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
