"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

/**
 * Error boundary for the protected app shell (sidebar/topbar stay intact).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center text-center h-[60vh] px-6">
      <div className="h-12 w-12 rounded-md bg-danger/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-danger" />
      </div>
      <h1 className="text-lg font-semibold text-white mb-1.5">Something went wrong</h1>
      <p className="text-sm text-muted max-w-sm mb-5">
        An unexpected error occurred while loading this page. Retrying usually fixes it.
      </p>
      <Button onClick={reset} size="sm">
        Try again
      </Button>
    </div>
  );
}
