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
      <div className="flex flex-col items-center text-center py-16 border border-white/[0.08] rounded-2xl bg-surface/50">
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3.5 text-primary">
          <FolderKanban className="h-5 w-5" />
        </div>
        <p className="text-sm font-bold text-white mb-1">No projects yet</p>
        <p className="text-xs text-white/50 max-w-xs">
          Create your first project to start organizing tasks and tracking team sprints.
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
            className="group block rounded-2xl border border-white/[0.08] bg-surface/75 backdrop-blur-sm p-5 hover:border-white/20 transition-all duration-200 shadow-sm hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-sm font-bold text-white leading-snug group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <Badge variant={statusVariant[project.status]} className="capitalize shrink-0">
                {project.status.replace("_", " ")}
              </Badge>
            </div>

            {project.description && (
              <p className="text-xs text-white/55 mb-4 line-clamp-2 leading-relaxed">{project.description}</p>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                <span className="text-white/50">
                  {done} / {total} tasks
                </span>
                <span className="text-white font-semibold">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {project.due_date && (
              <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono">
                <Calendar className="h-3 w-3 text-white/50" />
                <span>Due {new Date(project.due_date).toLocaleDateString()}</span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
