"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  Trash2,
  CheckCheck,
  KanbanSquare,
  LifeBuoy,
  Sparkles,
  MessageSquare,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/app/(app)/notifications/actions";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

type NotificationTab = "all" | "unread" | "tasks" | "support";

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getNotificationIcon(type: string) {
  if (type.includes("task")) return KanbanSquare;
  if (type.includes("ticket") || type.includes("support")) return LifeBuoy;
  if (type.includes("deal")) return Sparkles;
  if (type.includes("comment") || type.includes("message")) return MessageSquare;
  return AlertCircle;
}

export function NotificationBell({
  initialNotifications,
  organizationId,
  userId,
}: {
  initialNotifications: NotificationItem[];
  organizationId: string;
  userId: string;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Real-time subscription: new notifications appear instantly
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as NotificationItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await markNotificationRead(id);
  }

  async function handleDelete(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsRead(organizationId);
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.is_read;
    if (activeTab === "tasks") return n.type.includes("task");
    if (activeTab === "support") return n.type.includes("ticket") || n.type.includes("support");
    return true;
  });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open notifications"
        className={cn(
          "h-9 w-9 flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white transition-all duration-150 relative active:scale-95",
          open && "border-primary/40 bg-primary/10 text-primary"
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-[0_0_10px_var(--primary-glow)] animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-84 sm:w-96 rounded-2xl border border-white/[0.1] bg-surface/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-white/60 hover:text-primary transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] bg-black/20 text-xs">
            {(
              [
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "tasks", label: "Tasks" },
                { id: "support", label: "Support" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-white font-semibold shadow-sm"
                    : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-88 overflow-y-auto divide-y divide-white/[0.04]">
            {filteredNotifications.length === 0 ? (
              <div className="px-6 py-12 text-center flex flex-col items-center justify-center">
                <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/40 mb-3">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-white mb-0.5">No notifications here</p>
                <p className="text-[11px] text-white/40 max-w-xs">
                  {activeTab === "unread"
                    ? "You're completely caught up with all workspace updates."
                    : "Notifications for deals, tasks, tickets, and team channels will appear here."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const Icon = getNotificationIcon(n.type);
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 p-3.5 transition-colors group relative",
                      !n.is_read
                        ? "bg-primary/[0.04] hover:bg-primary/[0.08]"
                        : "hover:bg-white/[0.02]"
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5",
                        !n.is_read
                          ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_10px_var(--primary-glow)]"
                          : "bg-white/[0.04] border-white/10 text-white/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        {n.link ? (
                          <Link
                            href={n.link}
                            onClick={() => {
                              handleMarkRead(n.id);
                              setOpen(false);
                            }}
                            className="text-xs font-bold text-white hover:text-primary transition-colors truncate block"
                          >
                            {n.title}
                          </Link>
                        ) : (
                          <p className="text-xs font-bold text-white truncate">{n.title}</p>
                        )}
                        <span className="text-[10px] font-mono text-white/40 shrink-0">
                          {relativeTime(n.created_at)}
                        </span>
                      </div>

                      {n.body && (
                        <p className="text-[11px] text-white/60 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      {!n.is_read && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.id)}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
                          title="Mark read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(n.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
