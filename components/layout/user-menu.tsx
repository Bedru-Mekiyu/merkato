"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LogOut,
  Settings,
  Shield,
  Coffee,
  Sparkles,
  Activity,
  User,
  Check,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PRESENCE_STATUSES = [
  { id: "online", label: "Available", color: "bg-emerald-400" },
  { id: "focus", label: "In Focus", color: "bg-indigo-400" },
  { id: "meeting", label: "In Meeting", color: "bg-purple-400" },
  { id: "tea", label: "Tea Break ☕", color: "bg-amber-400" },
  { id: "away", label: "Away", color: "bg-zinc-400" },
];

const PRESENCE_KEY = "merkato_presence_status";

export function UserMenu({
  userEmail,
  userName,
  orgName,
}: {
  userEmail: string | null;
  userName: string | null;
  orgName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>("online");
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRESENCE_KEY);
      if (saved && PRESENCE_STATUSES.some((s) => s.id === saved)) {
        setStatus(saved);
      }
    } catch {
      // Storage error ignored
    }
  }, []);

  function handleSetStatus(statusId: string) {
    setStatus(statusId);
    try {
      localStorage.setItem(PRESENCE_KEY, statusId);
    } catch {
      // Storage error ignored
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = (userName || userEmail || "?").charAt(0).toUpperCase();
  const currentStatus = PRESENCE_STATUSES.find((s) => s.id === status) ?? PRESENCE_STATUSES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        className={cn(
          "relative h-9 w-9 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-xs font-bold text-white transition-all active:scale-95",
          open && "border-primary/40 ring-2 ring-primary/20 bg-primary/10"
        )}
      >
        <span className="h-full w-full flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
          {initial}
        </span>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
            currentStatus.color
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-white/[0.1] bg-surface/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up divide-y divide-white/[0.06]">
          {/* User & Workspace Profile Header */}
          <div className="p-3.5 bg-white/[0.02]">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-secondary text-white font-bold flex items-center justify-center text-sm shadow-[0_0_12px_var(--primary-glow)] shrink-0">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {userName || "Team Member"}
                </p>
                <p className="text-[11px] text-white/50 truncate font-mono">{userEmail}</p>
              </div>
            </div>

            {orgName && (
              <div className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded-lg bg-black/30 border border-white/[0.04]">
                <span className="text-white/40 uppercase">Workspace</span>
                <span className="text-primary font-bold truncate max-w-[120px]">{orgName}</span>
              </div>
            )}
          </div>

          {/* Quick Presence Status Picker */}
          <div className="p-2.5 space-y-1">
            <p className="px-2 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
              Set Status
            </p>
            <div className="grid grid-cols-1 gap-0.5">
              {PRESENCE_STATUSES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSetStatus(s.id)}
                  className={cn(
                    "flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors w-full text-left",
                    status === s.id
                      ? "bg-primary/10 text-white font-semibold"
                      : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", s.color)} />
                    <span className="text-[11px]">{s.label}</span>
                  </div>
                  {status === s.id && <Check className="h-3 w-3 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-1.5 space-y-0.5 text-xs">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-white/50" />
              <span>Workspace Settings</span>
            </Link>
            <Link
              href="/cluster"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Activity className="h-3.5 w-3.5 text-white/50" />
              <span>System Health &amp; Telemetry</span>
            </Link>
            <Link
              href="/settings/mfa"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-white/50" />
              <span>Two-Factor Security (MFA)</span>
            </Link>
          </div>

          {/* Logout Action */}
          <div className="p-1.5">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
