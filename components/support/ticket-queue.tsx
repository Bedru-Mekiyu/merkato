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
    <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Customer Support Queue</h1>
          <p className="text-xs text-white/50 mt-0.5">
            {tickets.length} ticket{tickets.length === 1 ? "" : "s"} across active workspace queues
          </p>
        </div>
        <button
          type="button"
          onClick={copyPortalLink}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white border border-white/10 bg-white/[0.04] rounded-lg px-3 py-1.5 transition-all hover:bg-white/[0.08] active:scale-95"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-primary" />}
          <span>{copied ? "Copied Link" : "Copy Customer Portal Link"}</span>
        </button>
      </div>

      <div className="flex items-center gap-1 border border-white/[0.08] rounded-xl p-1 w-fit bg-surface/60 backdrop-blur-md">
        {(["open", "pending", "resolved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150 active:scale-95",
              filter === f
                ? "bg-primary text-white shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/[0.04]"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 border border-white/[0.08] rounded-2xl bg-surface/50">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary">
            <LifeBuoy className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold text-white mb-1">No {filter !== "all" ? filter : ""} tickets</p>
          <p className="text-xs text-white/50 max-w-xs">
            Customer inquiries submitted through your public portal will appear here automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View (Phone / Small Tablet) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/support/tickets/${ticket.id}`}
                className="block p-4 rounded-xl border border-white/[0.08] bg-surface/75 backdrop-blur-sm hover:border-white/20 transition-all shadow-sm group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                    {ticket.subject}
                  </h3>
                  <Badge variant={statusBadge[ticket.status]} className="capitalize shrink-0">
                    {ticket.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-white/50 pt-2 border-t border-white/[0.06]">
                  <span>{ticket.customer_name}</span>
                  <span className={cn("font-semibold capitalize", priorityColor[ticket.priority])}>
                    {ticket.priority}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop / Tablet Table View */}
          <div className="hidden md:block rounded-2xl border border-white/[0.08] bg-surface/75 backdrop-blur-sm overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-white/50 uppercase font-mono tracking-wider">
                  <th className="px-5 py-3.5 font-semibold">Subject</th>
                  <th className="px-5 py-3.5 font-semibold">Customer</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Priority</th>
                  <th className="px-5 py-3.5 font-semibold">Assigned To</th>
                  <th className="px-5 py-3.5 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    onClick={() => (window.location.href = `/support/tickets/${ticket.id}`)}
                  >
                    <td className="px-5 py-3.5 font-semibold text-white group-hover:text-primary transition-colors">
                      <Link href={`/support/tickets/${ticket.id}`}>
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-white/60 font-mono">{ticket.customer_name}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusBadge[ticket.status]} className="capitalize">
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className={cn("px-5 py-3.5 capitalize font-mono font-semibold", priorityColor[ticket.priority])}>
                      {ticket.priority}
                    </td>
                    <td className="px-5 py-3.5 text-white/60 font-mono">{ticket.assignee_name ?? "Unassigned"}</td>
                    <td className="px-5 py-3.5 text-white/40 font-mono">
                      {new Date(ticket.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
