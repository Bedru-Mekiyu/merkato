"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, Zap, Radio, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/team", label: "Channels" },
  { href: "/team/directory", label: "Directory" },
  { href: "/team/activity", label: "Activity" },
];

const PRESENCE_STORAGE_KEY = "merkato_team_presence";

export function TeamTabs() {
  const pathname = usePathname();
  const [presence, setPresence] = useState<string>("active");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRESENCE_STORAGE_KEY);
      if (saved) setPresence(saved);
    } catch {
      // Ignore
    }
  }, []);

  function handlePresenceChange(status: string) {
    setPresence(status);
    try {
      localStorage.setItem(PRESENCE_STORAGE_KEY, status);
    } catch {
      // Ignore
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 sm:px-8 bg-surface/40 backdrop-blur-md">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const active =
            tab.href === "/team"
              ? pathname === "/team" || pathname.startsWith("/team/channels") || pathname.startsWith("/team/dm")
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-3 py-3 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition-all duration-150",
                active
                  ? "border-primary text-white"
                  : "border-transparent text-white/50 hover:text-white"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Modern-Thin Tea & Presence Quick Status Bar */}
      <div className="flex items-center gap-1.5 py-2">
        <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider hidden sm:inline">
          Presence:
        </span>
        <button
          type="button"
          onClick={() => handlePresenceChange("active")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 active:scale-95",
            presence === "active"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
              : "bg-white/[0.03] text-white/50 border-white/[0.06] hover:bg-white/[0.06]"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active</span>
        </button>

        <button
          type="button"
          onClick={() => handlePresenceChange("tea")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 active:scale-95",
            presence === "tea"
              ? "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
              : "bg-white/[0.03] text-white/50 border-white/[0.06] hover:bg-white/[0.06]"
          )}
        >
          <Coffee className="h-3 w-3 text-amber-400" />
          <span>Tea Break</span>
        </button>

        <button
          type="button"
          onClick={() => handlePresenceChange("focus")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-150 active:scale-95",
            presence === "focus"
              ? "bg-primary/15 text-primary border-primary/30 shadow-[0_0_8px_var(--primary-glow)]"
              : "bg-white/[0.03] text-white/50 border-white/[0.06] hover:bg-white/[0.06]"
          )}
        >
          <Zap className="h-3 w-3 text-primary" />
          <span>Sprinting</span>
        </button>
      </div>
    </div>
  );
}
