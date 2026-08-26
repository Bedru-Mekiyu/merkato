"use server";

import { createClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/org-context";
import { logActivity } from "@/lib/activity";
import { notify } from "@/lib/notify";
import { sendEmail, appUrl } from "@/lib/email/client";
import { taskAssignedEmail } from "@/lib/email/templates";
import { revalidatePath } from "next/cache";
import type { ProjectStatus, TaskStatus, TaskPriority } from "@/types/database";

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export async function createProject(formData: FormData) {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const due_date = String(formData.get("due_date") ?? "").trim() || null;

  if (!name) return { error: "Project name is required." };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: ctx.organization.id,
      name,
      description,
      due_date,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logActivity({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    type: "project_created",
    summary: `created the project "${name}"`,
    link: `/projects/${data.id}`,
  });

  revalidatePath("/projects");
  return { success: true, project: data };
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);

  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { success: true };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export async function createTask(formData: FormData) {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const project_id = String(formData.get("project_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const priority = (String(formData.get("priority") ?? "medium")) as TaskPriority;
  const due_date = String(formData.get("due_date") ?? "").trim() || null;
  const status = (String(formData.get("status") ?? "todo")) as TaskStatus;
  const assignee_id = String(formData.get("assignee_id") ?? "").trim() || null;

  if (!title) return { error: "Task title is required." };
  if (!project_id) return { error: "A project is required." };

  const { error } = await supabase.from("project_tasks").insert({
    organization_id: ctx.organization.id,
    project_id,
    title,
    priority,
    due_date,
    status,
    assignee_id,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };

  // Notify the assignee if one was specified and it's not the creator
  if (assignee_id && assignee_id !== ctx.userId) {
    await notify({
      organizationId: ctx.organization.id,
      actorId: ctx.userId,
      recipientIds: [assignee_id],
      type: "task_assigned",
      title: "You were assigned a task",
      body: `"${title}" was assigned to you.`,
      link: `/projects/${project_id}`,
    });

    // Also send an email
    const supabase2 = await createClient();
    const { data: assigneeEmail } = await supabase2
      .rpc("get_user_email", { p_user_id: assignee_id });

    if (assigneeEmail) {
      await sendEmail({
        to: assigneeEmail as string,
        ...taskAssignedEmail({
          assignerName: ctx.profile?.full_name ?? "A teammate",
          taskTitle: title,
          projectUrl: appUrl(`/projects/${project_id}`),
        }),
      });
    }
  }

  await logActivity({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    type: "task_created",
    summary: `created the task "${title}"`,
    link: `/projects/${project_id}`,
  });

  revalidatePath(`/projects/${project_id}`);
  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus, projectId: string) {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("project_tasks")
    .update({ status })
    .eq("id", taskId)
    .select("title")
    .single();

  if (error) return { error: error.message };

  await logActivity({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    type: status === "done" ? "task_completed" : "task_status_changed",
    summary:
      status === "done"
        ? `completed the task "${task?.title ?? ""}" ✓`
        : `moved "${task?.title ?? ""}" to ${status.replace("_", " ")}`,
    link: `/projects/${projectId}`,
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateTask(taskId: string, projectId: string, formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priority = (String(formData.get("priority") ?? "medium")) as TaskPriority;
  const due_date = String(formData.get("due_date") ?? "").trim() || null;

  if (!title) return { error: "Task title is required." };

  const { error } = await supabase
    .from("project_tasks")
    .update({ title, description, priority, due_date })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_tasks").delete().eq("id", taskId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Subtasks
// ---------------------------------------------------------------------------
export async function createSubtask(taskId: string, projectId: string, formData: FormData) {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Subtask title is required." };

  const { error } = await supabase.from("task_subtasks").insert({
    organization_id: ctx.organization.id,
    task_id: taskId,
    title,
  });

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function toggleSubtask(subtaskId: string, isDone: boolean, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_subtasks")
    .update({ is_done: isDone })
    .eq("id", subtaskId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteSubtask(subtaskId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("task_subtasks").delete().eq("id", subtaskId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------
export async function createComment(taskId: string, projectId: string, formData: FormData) {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Comment cannot be empty." };

  const { error } = await supabase.from("task_comments").insert({
    organization_id: ctx.organization.id,
    task_id: taskId,
    body,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };

  await logActivity({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    type: "comment_added",
    summary: `commented on a task`,
    link: `/projects/${projectId}`,
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
