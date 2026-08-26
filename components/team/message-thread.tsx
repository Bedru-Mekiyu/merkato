"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/app/(app)/team/actions";
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

    await sendMessage(channelId, formData);
    setSending(false);
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="h-12 border-b border-border flex items-center px-4 shrink-0">
        <h3 className="text-sm font-semibold text-white">{channelLabel}</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center py-16">
            <MessageSquare className="h-5 w-5 text-faint mb-2" />
            <p className="text-sm text-muted">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((m) => {
          const name = m.created_by ? memberNames[m.created_by] ?? "Unknown" : "Unknown";
          const isMe = m.created_by === currentUserId;
          return (
            <div key={m.id} className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-medium text-accent shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-white">
                    {isMe ? "You" : name}
                  </span>
                  <span className="text-xs text-faint">
                    {new Date(m.created_at).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">{m.body}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-border p-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${channelLabel}`}
          className="flex-1 h-10 px-3 rounded-sm bg-surface border border-border text-sm text-white placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="h-10 w-10 flex items-center justify-center rounded-sm bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
