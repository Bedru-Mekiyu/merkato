import Link from "next/link";
import { Plus, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SupportTicket, TicketStatus } from "@/types/database";

const statusBadge: Record<TicketStatus, "default" | "accent" | "success" | "warning"> = {
  open: "accent",
  pending: "warning",
  resolved: "success",
  closed: "default",
};

export function MyRequestsList({
  tickets,
  orgSlug,
}: {
  tickets: SupportTicket[];
  orgSlug: string;
}) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">My Requests</h1>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5">
            Track the status of your support tickets and replies
          </p>
        </div>
        <Link
          href={`/portal/${orgSlug}/new`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-hover rounded-xl px-4 py-2.5 transition-all shadow-[0_0_12px_var(--primary-glow)] active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Request</span>
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 border border-white/[0.08] rounded-2xl bg-surface/60 backdrop-blur-md">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-white mb-1">No requests yet</p>
          <p className="text-xs text-white/50 max-w-xs">
            Submit a support ticket and our team will get back to you promptly.
          </p>
        </div>
      ) : (
        <div className="border border-white/[0.08] rounded-2xl bg-surface/75 backdrop-blur-md divide-y divide-white/[0.06] overflow-hidden shadow-sm">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/portal/${orgSlug}/tickets/${ticket.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors group"
            >
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white group-hover:text-primary transition-colors">
                  {ticket.subject}
                </p>
                <p className="text-[11px] text-white/40 font-mono mt-0.5">
                  Submitted {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={statusBadge[ticket.status]} className="capitalize text-[10px]">
                {ticket.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
