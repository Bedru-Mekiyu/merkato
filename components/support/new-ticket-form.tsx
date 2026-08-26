"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTicket } from "@/app/(app)/support/actions";

export function NewTicketForm({ orgSlug }: { orgSlug: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await createTicket(orgSlug, formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push(`/portal/${orgSlug}/tickets/${result.ticketId}`);
  }

  return (
    <div>
      <Link
        href={`/portal/${orgSlug}`}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white mb-5 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        My Requests
      </Link>

      <h1 className="text-xl font-bold text-white mb-1">Submit a Request</h1>
      <p className="text-sm text-muted mb-6">
        Tell us what&apos;s going on and we&apos;ll get back to you as soon as possible.
      </p>

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">Subject</label>
          <Input name="subject" placeholder="Briefly describe the issue" required autoFocus />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">Category</label>
          <select
            name="category"
            defaultValue=""
            className="w-full h-10 px-3 rounded-sm bg-surface border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="">General</option>
            <option value="Billing">Billing</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Feature Request">Feature Request</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">Description</label>
          <textarea
            name="description"
            rows={6}
            placeholder="What happened? Include any details that might help us assist you faster."
            className="w-full px-3 py-2.5 rounded-sm bg-surface border border-border text-sm text-white placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent resize-none"
          />
        </div>

        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Submit Request
        </Button>
      </form>
    </div>
  );
}
