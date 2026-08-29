"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
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
    <div className="space-y-6 animate-fade-in-up">
      <Link
        href={`/portal/${orgSlug}`}
        className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white mb-2 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to My Requests</span>
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Submit a Support Request</h1>
        <p className="text-xs sm:text-sm text-white/50 mt-0.5">
          Describe the problem or question and our team will get back to you promptly.
        </p>
      </div>

      <form
        ref={formRef}
        action={handleSubmit}
        className="space-y-4 rounded-2xl border border-white/[0.08] bg-surface/75 backdrop-blur-md p-5 sm:p-6 shadow-xl"
      >
        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1.5">Subject</label>
          <Input
            name="subject"
            placeholder="Brief summary of your question or issue"
            required
            autoFocus
            className="bg-black/30 border-white/10"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1.5">Category</label>
          <select
            name="category"
            defaultValue=""
            className="w-full h-10 px-3.5 rounded-xl bg-black/30 border border-white/10 text-xs text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="" className="bg-surface text-white">General Question</option>
            <option value="Billing" className="bg-surface text-white">Billing &amp; Subscription</option>
            <option value="Technical Issue" className="bg-surface text-white">Technical Issue</option>
            <option value="Feature Request" className="bg-surface text-white">Feature Request</option>
            <option value="Other" className="bg-surface text-white">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/80 mb-1.5">Description</label>
          <textarea
            name="description"
            rows={6}
            placeholder="What happened? Include any relevant steps, URLs, or error details..."
            className="w-full px-3.5 py-3 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all leading-relaxed"
          />
        </div>

        {error && (
          <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full h-10 text-xs font-semibold flex items-center justify-center gap-2">
          <span>Submit Ticket</span>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
