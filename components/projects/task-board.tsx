"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, type ProjectTask, type TaskStatus } from "@/types/database";
import { updateTaskStatus } from "@/app/(app)/projects/actions";
import { useToast } from "@/components/ui/toast";

const priorityColor: Record<string, string> = {
  low: "bg-white/10 text-white/60",
  medium: "bg-accent/10 text-accent",
  high: "bg-warning/10 text-warning",
  urgent: "bg-danger/10 text-danger",
};

export function TaskBoard({
  projectId,
  tasks,
  onSelectTask,
}: {
  projectId: string;
  tasks: ProjectTask[];
  onSelectTask: (id: string) => void;
}) {
  const router = useRouter();
  const { report } = useToast();
  const [, startTransition] = useTransition();
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  function moveTask(taskId: string, status: TaskStatus) {
    const previous = localTasks;
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, status, projectId);
      if (!report(result)) {
        setLocalTasks(previous);
        return;
      }
      router.refresh();
    });
  }

  function handleDrop(status: TaskStatus, taskId: string) {
    setDragOverStatus(null);
    moveTask(taskId, status);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
      {TASK_STATUSES.map((statusDef) => {
        const columnTasks = localTasks.filter((t) => t.status === statusDef.value);

        return (
          <div
            key={statusDef.value}
            className="flex-shrink-0 w-72"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(statusDef.value);
            }}
            onDragLeave={() => setDragOverStatus(null)}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("taskId");
              if (taskId) handleDrop(statusDef.value, taskId);
            }}
          >
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-sm font-medium text-white/80">
                {statusDef.label}
                <span className="ml-1.5 text-faint">{columnTasks.length}</span>
              </h3>
            </div>

            <div
              className={cn(
                "rounded-md border bg-surface/40 min-h-[120px] p-2 space-y-2 transition-colors",
                dragOverStatus === statusDef.value
                  ? "border-accent/40 bg-accent/5"
                  : "border-border"
              )}
            >
              {columnTasks.map((task) => {
                const subtasks = task.task_subtasks ?? [];
                const doneSubtasks = subtasks.filter((s) => s.is_done).length;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
                    onClick={() => onSelectTask(task.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectTask(task.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Task: ${task.title}`}
                    className="rounded-sm border border-border bg-surface p-3 cursor-pointer hover:border-white/20 focus-visible:ring-2 focus-visible:ring-accent/40 outline-none transition-colors"
                  >
                    <p className="text-sm font-medium text-white leading-snug mb-2">
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded capitalize",
                          priorityColor[task.priority]
                        )}
                      >
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-faint">
                        {subtasks.length > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            {doneSubtasks}/{subtasks.length}
                          </span>
                        )}
                        {task.due_date && (
                          <span>{new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        )}
                      </div>
                    </div>

                    {/* Keyboard/touch accessible alternative to drag-and-drop */}
                    <label className="sr-only" htmlFor={`task-status-${task.id}`}>
                      Move {task.title} to another status
                    </label>
                    <select
                      id={`task-status-${task.id}`}
                      value={task.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                      className="mt-2.5 w-full h-8 px-2 rounded-sm bg-background border border-border text-xs text-white/80 hover:border-white/20 focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition-all"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

              {columnTasks.length === 0 && (
                <div className="h-16 flex items-center justify-center text-xs text-faint">
                  <Square className="h-3 w-3 mr-1.5 opacity-0" />
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
