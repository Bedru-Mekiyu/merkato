"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { createDeal } from "@/app/(app)/crm/actions";
import { DEAL_STAGES } from "@/types/database";

export function NewDealButton({
  companies,
  contacts,
}: {
  companies: { id: string; name: string }[];
  contacts: { id: string; full_name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createDeal(formData);
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
        New Deal
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="New Deal">
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Deal title
            </label>
            <Input name="title" placeholder="Acme Inc. — Annual Plan" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Value ($)
              </label>
              <Input name="value" type="number" min="0" step="1" placeholder="5000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Stage
              </label>
              <select
                name="stage"
                defaultValue="new_lead"
                className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Company
            </label>
            <select
              name="company_id"
              className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5">
              Contact
            </label>
            <select
              name="contact_id"
              className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="">No contact</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
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
