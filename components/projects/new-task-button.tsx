"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createTask } from "@/app/(app)/projects/actions";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/types/database";

export function NewTaskButton({
  projectId,
  members,
  defaultStatus,
}: {
  projectId: string;
  members: { id: string; name: string }[];
  defaultStatus?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createTask(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Task
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="New Task">
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <input type="hidden" name="project_id" value={projectId} />
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Task title
            </label>
            <Input name="title" placeholder="Design the homepage hero" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Status
              </label>
              <select
                name="status"
                defaultValue={defaultStatus ?? "todo"}
                className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Priority
              </label>
              <select
                name="priority"
                defaultValue="medium"
                className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Due date
            </label>
            <Input name="due_date" type="date" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Assignee
            </label>
            <select
              name="assignee_id"
              defaultValue=""
              className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
