"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, MessageSquare, ShieldCheck, Sparkles, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrCreateDM } from "@/app/(app)/team/actions";

export function DirectoryList({
  members,
  currentUserId,
}: {
  members: { id: string; userId: string; role: string; name: string }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleMessage(userId: string) {
    setLoadingId(userId);
    const result = await getOrCreateDM(userId);
    setLoadingId(null);
    if (result?.channelId) {
      router.push(`/team/dm/${userId}`);
    }
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-12 border border-white/[0.08] rounded-xl bg-surface/50">
        <Users className="h-5 w-5 text-white/30 mb-2" />
        <p className="text-sm text-white/60">No team members yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {members.map((m) => {
        const isCurrent = m.userId === currentUserId;
        const initial = (m.name || "?").charAt(0).toUpperCase();

        return (
          <div
            key={m.id}
            className="p-4 rounded-xl border border-white/[0.08] bg-surface/60 backdrop-blur-md flex flex-col justify-between hover:border-white/20 transition-all duration-150 group"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary border border-white/20 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_var(--primary-glow)]">
                    {initial}
                  </div>
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-surface border border-white/20 flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                </div>
                <Badge variant={m.role === "owner" ? "primary" : "default"}>
                  {m.role}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  {m.name} {isCurrent && <span className="text-white/40 text-xs font-normal">(You)</span>}
                </h4>
                <p className="text-xs text-white/50 font-mono mt-0.5 capitalize">
                  {m.role} · Verified Member
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active Node
              </span>

              {!isCurrent ? (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={loadingId === m.userId}
                  onClick={() => handleMessage(m.userId)}
                  className="h-7 text-xs px-2.5"
                >
                  <MessageSquare className="h-3 w-3" />
                  Direct Message
                </Button>
              ) : (
                <span className="text-[10px] font-mono text-white/40">Current Session</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
