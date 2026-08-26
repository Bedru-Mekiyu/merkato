import Link from "next/link";
import { Activity } from "lucide-react";
import type { ActivityLogEntry } from "@/types/database";

const typeColor: Record<string, string> = {
  deal_won: "bg-success/20 border-success/30 text-success",
  deal_lost: "bg-danger/20 border-danger/30 text-danger",
  task_completed: "bg-success/20 border-success/30 text-success",
};

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ entries }: { entries: ActivityLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-16 border border-border rounded-md bg-surface">
        <Activity className="h-5 w-5 text-faint mb-2" />
        <p className="text-sm text-muted">Nothing has happened yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const colorClass = typeColor[entry.type] ?? "bg-white/10 border-white/15 text-white/70";
        const content = (
          <div className="flex items-start gap-3 px-3 py-2.5 rounded-sm hover:bg-white/[0.02] transition-colors">
            <div className={`h-6 w-6 rounded-full border flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5 ${colorClass}`}>
              {(entry.actor_name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/90">
                <span className="font-medium text-white">{entry.actor_name}</span>{" "}
                {entry.summary}
              </p>
              <p className="text-xs text-faint mt-0.5">{relativeTime(entry.created_at)}</p>
            </div>
          </div>
        );

        return entry.link ? (
          <Link key={entry.id} href={entry.link} className="block">
            {content}
          </Link>
        ) : (
          <div key={entry.id}>{content}</div>
        );
      })}
    </div>
  );
}
