"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/(app)/team/actions";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/database";

export function MessageThread({
  channelId,
  channelLabel,
  initialMessages,
  currentUserId,
  memberNames,
}: {
  channelId: string;
  channelLabel: string;
  initialMessages: Message[];
  currentUserId: string;
  memberNames: Record<string, string>;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset local state when switching channels
  useEffect(() => {
    setMessages(initialMessages);
  }, [channelId, initialMessages]);

  // Live updates: subscribe to new messages in this channel
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const formData = new FormData();
    formData.set("body", draft);
    const body = draft;
    setDraft("");

    // optimistic append
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        organization_id: "",
        channel_id: channelId,
        body,
        created_by: currentUserId,
        created_at: new Date().toISOString(),
      },
    ]);

    const result = await sendMessage(channelId, formData);
    setSending(false);

    if (result?.error) {
      setMessages((prev) => prev.filter((message) => message.id !== tempId));
      setDraft(body);
      return;
    }

    if (result.message) {
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== tempId),
        result.message as Message,
      ]);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background/50">
      <div className="h-12 border-b border-white/[0.08] bg-surface/30 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white tracking-tight">{channelLabel}</h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center py-16">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-white mb-1">No messages yet</p>
            <p className="text-xs text-white/50 max-w-xs">
              Start the discussion with your team in {channelLabel}.
            </p>
          </div>
        )}
        {messages.map((m) => {
          const name = m.created_by ? memberNames[m.created_by] ?? "Unknown" : "Unknown";
          const isMe = m.created_by === currentUserId;
          return (
            <div
              key={m.id}
              className={cn(
                "flex gap-3 p-2 rounded-xl transition-colors hover:bg-white/[0.02]",
                isMe && "bg-primary/[0.03]"
              )}
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-secondary border border-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-white">
                    {isMe ? "You" : name}
                  </span>
                  <span className="text-[10px] font-mono text-white/40">
                    {new Date(m.created_at).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed mt-0.5 select-text">{m.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-white/[0.08] p-3 sm:p-4 bg-surface/50 backdrop-blur-md flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${channelLabel}...`}
          className="flex-1 h-10 px-3.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-40 transition-all duration-150 active:scale-95 shadow-[0_0_12px_var(--primary-glow)]"
        >
          <Send className="h-4 w-4" />
          <span className="text-xs hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
