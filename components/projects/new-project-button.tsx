"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createProject } from "@/app/(app)/projects/actions";

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createProject(formData);
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
        New Project
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="New Project">
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Project name
            </label>
            <Input name="name" placeholder="Website Redesign" required autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="What's this project about?"
              className="w-full px-3 py-2 rounded-sm bg-surface border border-border text-sm text-white placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Due date
            </label>
            <Input name="due_date" type="date" />
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
