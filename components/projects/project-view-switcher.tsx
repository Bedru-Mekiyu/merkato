"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TaskBoard } from "@/components/projects/task-board";
import { TaskListView } from "@/components/projects/task-list-view";
import { TaskCalendarView } from "@/components/projects/task-calendar-view";
import { TaskDetailPanel } from "@/components/projects/task-detail-panel";
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

  return (
    <div>
      <div className="flex items-center gap-1 mb-5 border border-border rounded-sm p-1 w-fit bg-surface">
        {(["board", "list", "calendar"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setView(mode)}
            className={cn(
              "px-3 py-1.5 rounded-sm text-sm font-medium capitalize transition-colors",
              view === mode
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-white"
            )}
          >
            {mode}
          </button>
        ))}
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
