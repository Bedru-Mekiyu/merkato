import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { ProjectViewSwitcher } from "@/components/projects/project-view-switcher";
import { NewTaskButton } from "@/components/projects/new-task-button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ProjectTask } from "@/types/database";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.organization.id)
    .single();

  if (!project) notFound();

  const { data: tasks } = await supabase
    .from("project_tasks")
    .select("*, task_subtasks(*)")
    .eq("project_id", id)
    .order("position", { ascending: true });

  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, profiles(full_name)")
    .eq("organization_id", ctx.organization.id);

  const memberOptions = (members ?? []).map((m) => ({
    id: m.user_id,
    name: m.profiles?.full_name || "Unnamed",
  }));

  return (
    <div className="px-6 sm:px-8 py-6">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Projects
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-white">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted mt-0.5">{project.description}</p>
            )}
          </div>
          <NewTaskButton projectId={id} members={memberOptions} />
        </div>

        <ProjectViewSwitcher
          projectId={id}
          tasks={(tasks ?? []) as ProjectTask[]}
          members={memberOptions}
        />
      </div>
    </div>
  );
}
