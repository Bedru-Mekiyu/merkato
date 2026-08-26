"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col items-center text-center py-12 border border-border rounded-md bg-surface">
        <Users className="h-5 w-5 text-faint mb-2" />
        <p className="text-sm text-muted">No team members yet.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md bg-surface divide-y divide-border">
      {members.map((m) => (
        <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-sm font-medium text-accent">
              {m.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{m.name}</p>
              <p className="text-xs text-muted capitalize">{m.role}</p>
            </div>
          </div>
          {m.userId !== currentUserId && (
            <Button
              size="sm"
              variant="secondary"
              loading={loadingId === m.userId}
              onClick={() => handleMessage(m.userId)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Message
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
