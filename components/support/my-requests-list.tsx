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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">My Requests</h1>
          <p className="text-sm text-muted">Track the status of your support requests</p>
        </div>
        <Link
          href={`/portal/${orgSlug}/new`}
          className="inline-flex items-center gap-1.5 text-sm font-medium bg-accent text-white hover:bg-accent-hover rounded-sm px-3.5 py-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Request
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 border border-border rounded-md bg-surface">
          <Inbox className="h-5 w-5 text-faint mb-2" />
          <p className="text-sm text-muted mb-1">No requests yet</p>
          <p className="text-xs text-faint">Submit a request and our team will get back to you.</p>
        </div>
      ) : (
        <div className="border border-border rounded-md bg-surface divide-y divide-border">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/portal/${orgSlug}/tickets/${ticket.id}`}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-white">{ticket.subject}</p>
                <p className="text-xs text-muted mt-0.5">
                  Submitted {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={statusBadge[ticket.status]} className="capitalize">
                {ticket.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
