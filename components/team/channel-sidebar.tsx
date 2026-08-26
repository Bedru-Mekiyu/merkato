"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Hash, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createChannel } from "@/app/(app)/team/actions";
import { useRouter } from "next/navigation";
import type { Channel } from "@/types/database";

export function ChannelSidebar({
  channels,
  dms,
}: {
  channels: Channel[];
  dms: { userId: string; name: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.set("name", name);
    const result = await createChannel(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setName("");
    router.refresh();
    if (result?.channel) {
      router.push(`/team/channels/${result.channel.id}`);
    }
  }

  return (
    <div className="w-56 border-r border-border flex flex-col shrink-0">
      <div className="px-3 py-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-faint uppercase tracking-wide">
          Channels
        </h3>
        <button
          onClick={() => setOpen(true)}
          className="h-5 w-5 flex items-center justify-center rounded text-faint hover:text-white hover:bg-white/5"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-2 space-y-0.5 mb-4">
        {channels.map((c) => {
          const active = pathname === `/team/channels/${c.id}`;
          return (
            <Link
              key={c.id}
              href={`/team/channels/${c.id}`}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-sm text-sm transition-colors",
                active ? "bg-accent/10 text-accent" : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Hash className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{c.name}</span>
            </Link>
          );
        })}
        {channels.length === 0 && (
          <p className="text-xs text-faint px-2.5 py-1">No channels yet.</p>
        )}
      </div>

      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-faint uppercase tracking-wide">
          Direct Messages
        </h3>
      </div>
      <div className="px-2 space-y-0.5">
        {dms.map((dm) => {
          const active = pathname === `/team/dm/${dm.userId}`;
          return (
            <Link
              key={dm.userId}
              href={`/team/dm/${dm.userId}`}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-sm text-sm transition-colors",
                active ? "bg-accent/10 text-accent" : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="h-4 w-4 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[9px] font-medium text-accent shrink-0">
                {dm.name.charAt(0).toUpperCase()}
              </span>
              <span className="truncate">{dm.name}</span>
            </Link>
          );
        })}
        {dms.length === 0 && (
          <p className="text-xs text-faint px-2.5 py-1">
            Message someone from the Directory tab.
          </p>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Channel">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Channel name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="general"
              required
              autoFocus
            />
          </div>
          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
