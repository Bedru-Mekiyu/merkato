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
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none -mx-4 px-4 sm:mx-0 sm:px-0">
      {TASK_STATUSES.map((statusDef) => {
        const columnTasks = localTasks.filter((t) => t.status === statusDef.value);

        return (
          <div
            key={statusDef.value}
            className="flex-shrink-0 w-72 sm:w-80 snap-center"
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
            <div className="flex items-center justify-between px-1 mb-2.5">
              <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{statusDef.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/60">
                  {columnTasks.length}
                </span>
              </h3>
            </div>

            <div
              className={cn(
                "rounded-xl border bg-surface/30 min-h-[140px] p-2 space-y-2 transition-colors",
                dragOverStatus === statusDef.value
                  ? "border-primary/40 bg-primary/5"
                  : "border-white/[0.06]"
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
                    className="group rounded-xl border border-white/[0.08] bg-surface/85 backdrop-blur-sm p-3.5 cursor-pointer hover:border-white/20 focus-visible:ring-2 focus-visible:ring-primary/40 outline-none transition-all shadow-sm"
                  >
                    <p className="text-xs font-bold text-white leading-snug mb-2 group-hover:text-primary transition-colors">
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-[10px] font-mono px-2 py-0.5 rounded-full capitalize font-semibold",
                          priorityColor[task.priority]
                        )}
                      >
                        {task.priority}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-white/40">
                        {subtasks.length > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckSquare className="h-3 w-3 text-emerald-400" />
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
                      className="mt-2.5 w-full h-7 px-2 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-white/80 hover:border-white/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value} className="bg-surface text-white">
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}

              {columnTasks.length === 0 && (
                <div className="h-20 flex items-center justify-center text-xs text-white/30 font-mono">
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
