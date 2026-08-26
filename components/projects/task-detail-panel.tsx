"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Trash2, Plus, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TASK_PRIORITIES } from "@/types/database";
import type { ProjectTask, TaskComment } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import {
  updateTask,
  deleteTask,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  createComment,
} from "@/app/(app)/projects/actions";

export function TaskDetailPanel({
  task,
  projectId,
  members,
  onClose,
}: {
  task: ProjectTask | null;
  projectId: string;
  members: { id: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [savingField, setSavingField] = useState(false);

  // Load comments whenever a different task is opened
  useEffect(() => {
    if (!task) {
      setComments([]);
      return;
    }
    let active = true;
    supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", task.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) setComments((data ?? []) as TaskComment[]);
      });
    return () => {
      active = false;
    };
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (task) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [task, onClose]);

  if (!task) return null;

  async function handleFieldBlur(formEl: HTMLFormElement) {
    setSavingField(true);
    const formData = new FormData(formEl);
    await updateTask(task!.id, projectId, formData);
    setSavingField(false);
    router.refresh();
  }

  async function handleDelete() {
    await deleteTask(task!.id, projectId);
    onClose();
    router.refresh();
  }

  async function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const formData = new FormData();
    formData.set("title", newSubtaskTitle);
    setNewSubtaskTitle("");
    await createSubtask(task!.id, projectId, formData);
    router.refresh();
  }

  async function handleToggleSubtask(subtaskId: string, isDone: boolean) {
    await toggleSubtask(subtaskId, isDone, projectId);
    router.refresh();
  }

  async function handleDeleteSubtask(subtaskId: string) {
    await deleteSubtask(subtaskId, projectId);
    router.refresh();
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const formData = new FormData();
    formData.set("body", newComment);
    const body = newComment;
    setNewComment("");
    // optimistic append
    setComments((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        task_id: task!.id,
        organization_id: "",
        body,
        created_by: null,
        created_at: new Date().toISOString(),
      },
    ]);
    await createComment(task!.id, projectId, formData);
  }

  const subtasks = task.task_subtasks ?? [];

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-surface border-l border-border overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <h2 className="text-sm font-semibold text-white">Task Details</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className="h-7 w-7 flex items-center justify-center rounded-sm text-faint hover:text-danger hover:bg-danger/10"
              title="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="h-7 w-7 flex items-center justify-center rounded-sm text-faint hover:text-white hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <FieldForm task={task} onBlurSubmit={handleFieldBlur} saving={savingField} members={members} />

          {/* Subtasks */}
          <div>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Subtasks {subtasks.length > 0 && `(${subtasks.filter((s) => s.is_done).length}/${subtasks.length})`}
            </h3>
            <div className="space-y-1.5 mb-2">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={sub.is_done}
                    onChange={(e) => handleToggleSubtask(sub.id, e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-background accent-accent"
                  />
                  <span
                    className={cn(
                      "text-sm flex-1",
                      sub.is_done ? "text-faint line-through" : "text-white/90"
                    )}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded text-faint hover:text-danger transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add subtask..."
                className="h-8 text-xs"
              />
              <Button type="submit" size="sm" variant="secondary">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
              Comments
            </h3>
            <div className="space-y-3 mb-3">
              {comments.length === 0 && (
                <p className="text-xs text-faint">No comments yet.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[10px] font-medium text-accent shrink-0">
                    ?
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/90">{c.body}</p>
                    <p className="text-xs text-faint mt-0.5">
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="h-8 text-xs"
              />
              <Button type="submit" size="sm" variant="secondary">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function FieldForm({
  task,
  onBlurSubmit,
  saving,
  members,
}: {
  task: ProjectTask;
  onBlurSubmit: (form: HTMLFormElement) => void;
  saving: boolean;
  members: { id: string; name: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      onBlur={() => {
        if (formRef.current) onBlurSubmit(formRef.current);
      }}
      className="space-y-3"
    >
      <div>
        <label className="block text-xs font-medium text-muted mb-1">Title</label>
        <Input name="title" defaultValue={task.title} key={`title-${task.id}`} />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted mb-1">Description</label>
        <textarea
          name="description"
          defaultValue={task.description ?? ""}
          key={`desc-${task.id}`}
          rows={3}
          placeholder="Add a description..."
          className="w-full px-3 py-2 rounded-sm bg-background border border-border text-sm text-white placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Priority</label>
          <select
            name="priority"
            defaultValue={task.priority}
            key={`priority-${task.id}`}
            className="w-full h-9 px-3 rounded-sm bg-background border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Due date</label>
          <Input
            name="due_date"
            type="date"
            defaultValue={task.due_date ?? ""}
            key={`due-${task.id}`}
            className="h-9"
          />
        </div>
      </div>
      {members.length > 0 && (
        <p className="text-xs text-faint">
          Assignee editing is available when creating a task; reassignment from
          here is coming soon.
        </p>
      )}
      {saving && <p className="text-xs text-faint">Saving...</p>}
    </form>
  );
}
