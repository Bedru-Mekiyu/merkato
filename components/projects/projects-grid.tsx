"use client";

import Link from "next/link";
import { FolderKanban, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Project, ProjectStatus } from "@/types/database";

const statusVariant: Record<ProjectStatus, "default" | "success" | "warning" | "danger" | "accent"> = {
  active: "accent",
  on_hold: "warning",
  completed: "success",
  archived: "default",
};

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-16 border border-border rounded-md bg-surface">
        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <FolderKanban className="h-5 w-5 text-faint" />
        </div>
        <p className="text-sm font-medium text-white mb-1">No projects yet</p>
        <p className="text-xs text-muted">
          Create your first project to start organizing tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const total = project.task_count ?? 0;
        const done = project.done_count ?? 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;

        return (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block rounded-md border border-border bg-surface p-4 hover:border-white/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-white leading-snug pr-2">
                {project.name}
              </h3>
              <Badge variant={statusVariant[project.status]} className="capitalize shrink-0">
                {project.status.replace("_", " ")}
              </Badge>
            </div>

            {project.description && (
              <p className="text-xs text-muted mb-3 line-clamp-2">{project.description}</p>
            )}

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted">
                  {done} / {total} tasks
                </span>
                <span className="text-xs text-muted">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {project.due_date && (
              <div className="flex items-center gap-1.5 text-xs text-faint">
                <Calendar className="h-3 w-3" />
                {new Date(project.due_date).toLocaleDateString()}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
