"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";

export function UserMenu({
  userEmail,
  userName,
}: {
  userEmail: string | null;
  userName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-sm font-medium text-accent"
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-surface shadow-modal py-1.5 z-50">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium text-white truncate">
              {userName || "Account"}
            </p>
            <p className="text-xs text-muted truncate">{userEmail}</p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
