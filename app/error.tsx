"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Error boundary for top-level routes outside the app shell (auth pages,
 * customer portal). Offers recovery instead of a blank screen.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route] Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background">
      <div className="h-12 w-12 rounded-md bg-danger/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-danger" />
      </div>
      <h1 className="text-lg font-semibold text-white mb-1.5">Something went wrong</h1>
      <p className="text-sm text-muted max-w-sm mb-5">
        An unexpected error occurred while loading this page. Retrying usually fixes it.
      </p>
      <div className="flex items-center gap-2">
        <Button onClick={reset} size="sm">
          Try again
        </Button>
        <Link
          href="/"
          className="inline-flex items-center h-8 px-3 rounded-sm border border-border bg-surface text-sm text-white hover:bg-white/5 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
