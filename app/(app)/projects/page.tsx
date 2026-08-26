import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { NewProjectButton } from "@/components/projects/new-project-button";
import { ProjectsGrid } from "@/components/projects/projects-grid";
import type { Project } from "@/types/database";

export default async function ProjectsPage() {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*, project_tasks(id, status)")
    .eq("organization_id", ctx.organization.id)
    .order("created_at", { ascending: false });

  const projectsWithCounts: Project[] = (projects ?? []).map((p) => {
    const tasks = (p.project_tasks as { id: string; status: string }[]) ?? [];
    return {
      ...p,
      project_tasks: undefined,
      task_count: tasks.length,
      done_count: tasks.filter((t) => t.status === "done").length,
    } as Project;
  });

  return (
    <div className="px-6 sm:px-8 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-white">Projects</h1>
          <p className="text-sm text-muted">
            {projectsWithCounts.length} project{projectsWithCounts.length === 1 ? "" : "s"} in your workspace
          </p>
        </div>
        <NewProjectButton />
      </div>

      <ProjectsGrid projects={projectsWithCounts} />
    </div>
  );
}
