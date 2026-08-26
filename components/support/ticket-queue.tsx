"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { LifeBuoy, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { SupportTicket, TicketStatus } from "@/types/database";

const statusBadge: Record<TicketStatus, "default" | "accent" | "success" | "warning"> = {
  open: "accent",
  pending: "warning",
  resolved: "success",
  closed: "default",
};

const priorityColor: Record<string, string> = {
  low: "text-white/50",
  medium: "text-accent",
  high: "text-warning",
  urgent: "text-danger",
};

export function TicketQueue({
  tickets,
  orgSlug,
}: {
  tickets: SupportTicket[];
  orgSlug: string;
}) {
  const [filter, setFilter] = useState<"open" | "pending" | "resolved" | "all">("open");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/portal/${orgSlug}` : `/portal/${orgSlug}`;

  function copyPortalLink() {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="px-6 sm:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-white">Support</h1>
          <p className="text-sm text-muted">
            {tickets.length} ticket{tickets.length === 1 ? "" : "s"} total
          </p>
        </div>
        <button
          onClick={copyPortalLink}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white border border-border rounded-sm px-2.5 py-1.5 transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy customer portal link"}
        </button>
      </div>

      <div className="flex items-center gap-1 mb-5 border border-border rounded-sm p-1 w-fit bg-surface">
        {(["open", "pending", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-sm text-sm font-medium capitalize transition-colors",
              filter === f ? "bg-accent/10 text-accent" : "text-muted hover:text-white"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 border border-border rounded-md bg-surface">
          <LifeBuoy className="h-5 w-5 text-faint mb-2" />
          <p className="text-sm text-muted">No {filter !== "all" ? filter : ""} tickets.</p>
        </div>
      ) : (
        <div className="border border-border rounded-md bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Subject</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Customer</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Status</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Priority</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Assigned to</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-white/[0.02] cursor-pointer"
                  onClick={() => (window.location.href = `/support/tickets/${ticket.id}`)}
                >
                  <td className="px-4 py-3">
                    <Link href={`/support/tickets/${ticket.id}`} className="text-white font-medium hover:text-accent">
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{ticket.customer_name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusBadge[ticket.status]} className="capitalize">
                      {ticket.status}
                    </Badge>
                  </td>
                  <td className={cn("px-4 py-3 capitalize text-xs font-medium", priorityColor[ticket.priority])}>
                    {ticket.priority}
                  </td>
                  <td className="px-4 py-3 text-muted">{ticket.assignee_name ?? "Unassigned"}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
