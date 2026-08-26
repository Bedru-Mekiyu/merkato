"use client";

import { useState, useMemo } from "react";
import { ListTodo, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectTask } from "@/types/database";

const priorityRank: Record<string, number> = { urgent: 3, high: 2, medium: 1, low: 0 };

const statusBadge: Record<string, string> = {
  todo: "bg-white/10 text-white/60",
  in_progress: "bg-accent/10 text-accent",
  review: "bg-warning/10 text-warning",
  done: "bg-success/10 text-success",
};

const priorityBadge: Record<string, string> = {
  low: "bg-white/10 text-white/60",
  medium: "bg-accent/10 text-accent",
  high: "bg-warning/10 text-warning",
  urgent: "bg-danger/10 text-danger",
};

type SortKey = "priority" | "due_date" | "title";

export function TaskListView({
  tasks,
  onSelectTask,
}: {
  tasks: ProjectTask[];
  onSelectTask: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("due_date");

  const sorted = useMemo(() => {
    const copy = [...tasks];
    copy.sort((a, b) => {
      if (sortKey === "priority") {
        return priorityRank[b.priority] - priorityRank[a.priority];
      }
      if (sortKey === "due_date") {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return a.title.localeCompare(b.title);
    });
    return copy;
  }, [tasks, sortKey]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-16 border border-border rounded-md bg-surface">
        <ListTodo className="h-5 w-5 text-faint mb-2" />
        <p className="text-sm text-muted">No tasks yet.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md bg-surface overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-4 py-2.5 text-xs font-medium text-muted">
              <SortHeader label="Task" active={sortKey === "title"} onClick={() => setSortKey("title")} />
            </th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Status</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">
              <SortHeader label="Priority" active={sortKey === "priority"} onClick={() => setSortKey("priority")} />
            </th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">
              <SortHeader label="Due date" active={sortKey === "due_date"} onClick={() => setSortKey("due_date")} />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((task) => (
            <tr
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              className="hover:bg-white/[0.02] cursor-pointer"
            >
              <td className="px-4 py-3 text-white font-medium">{task.title}</td>
              <td className="px-4 py-3">
                <span className={cn("text-xs px-1.5 py-0.5 rounded capitalize", statusBadge[task.status])}>
                  {task.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={cn("text-xs px-1.5 py-0.5 rounded capitalize", priorityBadge[task.priority])}>
                  {task.priority}
                </span>
              </td>
              <td className="px-4 py-3 text-muted">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortHeader({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 hover:text-white transition-colors",
        active && "text-white"
      )}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}
