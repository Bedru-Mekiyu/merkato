"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectTask } from "@/types/database";

const priorityDot: Record<string, string> = {
  low: "bg-white/40",
  medium: "bg-accent",
  high: "bg-warning",
  urgent: "bg-danger",
};

function ymd(date: Date) {
  // Local date parts — never toISOString(), which shifts date-only values
  // across timezones (e.g. UTC+3 turns "2026-08-27" into the 26th).
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function TaskCalendarView({
  tasks,
  onSelectTask,
}: {
  tasks: ProjectTask[];
  onSelectTask: (id: string) => void;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const tasksByDate = useMemo(() => {
    const map = new Map<string, ProjectTask[]>();
    for (const task of tasks) {
      if (!task.due_date) continue;
      const key = task.due_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const today = ymd(new Date());
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="border border-border rounded-md bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-white">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="h-7 w-7 flex items-center justify-center rounded-sm text-muted hover:text-white hover:bg-white/5"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="h-7 w-7 flex items-center justify-center rounded-sm text-muted hover:text-white hover:bg-white/5"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-2 text-xs font-medium text-faint text-center">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          const key = date ? ymd(date) : `empty-${i}`;
          const dayTasks = date ? tasksByDate.get(ymd(date)) ?? [] : [];
          const isToday = date && ymd(date) === today;

          return (
            <div
              key={key}
              className={cn(
                "min-h-[88px] border-r border-b border-border p-1.5 last:border-r-0",
                !date && "bg-white/[0.01]"
              )}
            >
              {date && (
                <>
                  <span
                    className={cn(
                      "inline-flex items-center justify-center h-5 w-5 rounded-full text-xs mb-1",
                      isToday ? "bg-accent text-white" : "text-muted"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => onSelectTask(task.id)}
                        className="flex items-center gap-1 w-full text-left text-[11px] text-white/80 hover:text-white truncate"
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", priorityDot[task.priority])} />
                        <span className="truncate">{task.title}</span>
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="text-[11px] text-faint pl-2.5">+{dayTasks.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
