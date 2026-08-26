"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TICKET_STATUSES,
  TICKET_PRIORITIES,
  type SupportTicket,
  type TicketMessage,
  type TicketStatus,
  type TicketPriority,
} from "@/types/database";
import {
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  staffReply,
  customerReply,
} from "@/app/(app)/support/actions";

const statusBadge: Record<TicketStatus, "default" | "accent" | "success" | "warning"> = {
  open: "accent",
  pending: "warning",
  resolved: "success",
  closed: "default",
};

export function TicketDetail({
  ticket,
  messages,
  staffMembers = [],
  currentUserId,
  isStaffView,
  backHref,
}: {
  ticket: SupportTicket;
  messages: TicketMessage[];
  staffMembers?: { id: string; name: string }[];
  currentUserId: string;
  isStaffView: boolean;
  backHref?: string;
}) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const visibleMessages = isStaffView
    ? messages
    : messages.filter((m) => !m.is_internal_note);

  async function handleStatusChange(status: TicketStatus) {
    setStatusLoading(true);
    await updateTicketStatus(ticket.id, status);
    setStatusLoading(false);
    router.refresh();
  }

  async function handlePriorityChange(priority: TicketPriority) {
    await updateTicketPriority(ticket.id, priority);
    router.refresh();
  }

  async function handleAssign(assigneeId: string) {
    await assignTicket(ticket.id, assigneeId || null);
    router.refresh();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    const formData = new FormData();
    formData.set("body", reply);
    if (isInternalNote) formData.set("is_internal_note", "on");

    if (isStaffView) {
      await staffReply(ticket.id, formData);
    } else {
      await customerReply(ticket.id, formData);
    }

    setReply("");
    setIsInternalNote(false);
    setSending(false);
    router.refresh();
  }

  return (
    <div>
      <Link
        href={backHref ?? "/support"}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white mb-5 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {isStaffView ? "All Tickets" : "My Requests"}
      </Link>

      <div className={cn("grid grid-cols-1 gap-6", isStaffView && "lg:grid-cols-3")}>
        {/* Conversation */}
        <div className={cn(isStaffView && "lg:col-span-2")}>
          <h1 className="text-xl font-bold text-white mb-1">{ticket.subject}</h1>
          <p className="text-sm text-muted mb-6">{ticket.description}</p>

          <div className="space-y-4 mb-6">
            {visibleMessages.length === 0 && (
              <p className="text-sm text-faint">No replies yet.</p>
            )}
            {visibleMessages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-md border p-4",
                  m.is_internal_note
                    ? "bg-warning/[0.06] border-warning/20"
                    : "bg-surface border-border"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-white flex items-center gap-1.5">
                    {m.is_internal_note && <StickyNote className="h-3 w-3 text-warning" />}
                    {m.created_by === currentUserId ? "You" : m.author_name}
                  </span>
                  <span className="text-xs text-faint">
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                  {m.body}
                </p>
                {m.is_internal_note && (
                  <p className="text-xs text-warning mt-1.5">
                    Internal note — not visible to customer
                  </p>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="space-y-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              placeholder={isStaffView ? "Write a reply or internal note..." : "Write a reply..."}
              className="w-full px-3 py-2.5 rounded-sm bg-surface border border-border text-sm text-white placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent resize-none"
            />
            <div className="flex items-center justify-between">
              {isStaffView ? (
                <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-border bg-background accent-warning"
                  />
                  Internal note (staff only)
                </label>
              ) : (
                <span />
              )}
              <Button type="submit" size="sm" loading={sending}>
                <Send className="h-3.5 w-3.5" />
                {isInternalNote ? "Add Note" : "Send Reply"}
              </Button>
            </div>
          </form>
        </div>

        {/* Properties sidebar */}
        <div className="space-y-4">
          <div className="border border-border rounded-md bg-surface p-4">
            <h3 className="text-xs font-semibold text-faint uppercase tracking-wide mb-3">
              Ticket Properties
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted mb-1">Status</p>
                {isStaffView ? (
                  <select
                    value={ticket.status}
                    disabled={statusLoading}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="w-full h-9 px-2.5 rounded-sm bg-background border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge variant={statusBadge[ticket.status]} className="capitalize">
                    {ticket.status}
                  </Badge>
                )}
              </div>

              {isStaffView && (
                <div>
                  <p className="text-xs text-muted mb-1">Priority</p>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                    className="w-full h-9 px-2.5 rounded-sm bg-background border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isStaffView && (
                <div>
                  <p className="text-xs text-muted mb-1">Assigned to</p>
                  <select
                    value={ticket.assigned_to ?? ""}
                    onChange={(e) => handleAssign(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-sm bg-background border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
                  >
                    <option value="">Unassigned</option>
                    {staffMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <p className="text-xs text-muted mb-1">Customer</p>
                <p className="text-sm text-white">{ticket.customer_name}</p>
              </div>

              {ticket.category && (
                <div>
                  <p className="text-xs text-muted mb-1">Category</p>
                  <p className="text-sm text-white">{ticket.category}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted mb-1">Created</p>
                <p className="text-sm text-white">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
