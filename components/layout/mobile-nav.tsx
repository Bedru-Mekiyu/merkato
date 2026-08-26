"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark, NavLinks } from "@/components/layout/sidebar";

/**
 * Mobile navigation drawer. The desktop sidebar is hidden below the md
 * breakpoint, so without this there is no way to move between sections on
 * a phone. Opens via hamburger in the topbar, closes on route change,
 * Escape, overlay tap, or link click.
 */
export function MobileNav({ orgName }: { orgName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/settings");

  // Close whenever the route changes (e.g. after navigating from the drawer)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape to close + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="md:hidden h-8 w-8 flex items-center justify-center rounded-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors shrink-0"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open &&
        createPortal(
          <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface border-r border-border flex flex-col shadow-modal animate-slide-in-left">
              <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
                <BrandMark size="sm" />
                <span className="text-sm font-semibold text-white truncate">{orgName}</span>
              </div>
              <nav aria-label="Main" className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
                <NavLinks onNavigate={() => setOpen(false)} />
              </nav>
              <div className="px-2 py-3 border-t border-border">
                <Link
                  href="/settings"
                  aria-current={settingsActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-medium transition-colors",
                    settingsActive
                      ? "bg-accent/10 text-accent"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Settings className="h-4 w-4" strokeWidth={2} />
                  Settings
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
