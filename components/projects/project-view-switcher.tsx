"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TaskBoard } from "@/components/projects/task-board";
import { TaskListView } from "@/components/projects/task-list-view";
import { TaskCalendarView } from "@/components/projects/task-calendar-view";
import { TaskDetailPanel } from "@/components/projects/task-detail-panel";
import { KanbanSquare, ListTodo, CalendarDays } from "lucide-react";
import type { ProjectTask } from "@/types/database";

type ViewMode = "board" | "list" | "calendar";

export function ProjectViewSwitcher({
  projectId,
  tasks,
  members,
}: {
  projectId: string;
  tasks: ProjectTask[];
  members: { id: string; name: string }[];
}) {
  const [view, setView] = useState<ViewMode>("board");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  const viewButtons = [
    { id: "board" as const, label: "Kanban Board", icon: KanbanSquare },
    { id: "list" as const, label: "Task List", icon: ListTodo },
    { id: "calendar" as const, label: "Timeline Calendar", icon: CalendarDays },
  ];

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 border border-white/[0.08] rounded-xl p-1 w-fit bg-surface/80 backdrop-blur-md">
        {viewButtons.map((btn) => {
          const Icon = btn.icon;
          const active = view === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setView(btn.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95",
                active
                  ? "bg-primary text-white shadow-[0_0_12px_var(--primary-glow)]"
                  : "text-white/50 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {view === "board" && (
        <TaskBoard
          projectId={projectId}
          tasks={tasks}
          onSelectTask={setSelectedTaskId}
        />
      )}
      {view === "list" && (
        <TaskListView tasks={tasks} onSelectTask={setSelectedTaskId} />
      )}
      {view === "calendar" && (
        <TaskCalendarView tasks={tasks} onSelectTask={setSelectedTaskId} />
      )}

      <TaskDetailPanel
        task={selectedTask}
        projectId={projectId}
        members={members}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}
