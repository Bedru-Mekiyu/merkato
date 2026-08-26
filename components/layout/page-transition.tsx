"use client";

import { usePathname } from "next/navigation";

/**
 * Replays a subtle entrance animation on every route change by keying
 * the content wrapper on the current pathname.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="min-h-full animate-fade-in">
      {children}
    </div>
  );
}
