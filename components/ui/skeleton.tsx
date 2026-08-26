import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton-shimmer rounded-sm", className)}
    />
  );
}

/**
 * Generic route-level skeleton that mirrors the common page shape:
 * title, optional subtitle, then content panels. Used by loading.tsx files.
 */
export function RouteSkeleton() {
  return (
    <div className="px-6 sm:px-8 py-8 max-w-6xl mx-auto" role="status" aria-label="Loading">
      <Skeleton className="h-7 w-56 mb-2" />
      <Skeleton className="h-4 w-80 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
