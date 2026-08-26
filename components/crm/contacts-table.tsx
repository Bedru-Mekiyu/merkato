"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Users } from "lucide-react";
import { deleteContact } from "@/app/(app)/crm/actions";
import type { Contact } from "@/types/database";

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteContact(id);
    setDeletingId(null);
    router.refresh();
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-16 border border-border rounded-md bg-surface">
        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <Users className="h-5 w-5 text-faint" />
        </div>
        <p className="text-sm font-medium text-white mb-1">No contacts yet</p>
        <p className="text-xs text-muted">
          Add a contact to start tracking interactions.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-md bg-surface overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Name</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Company</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Email</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Phone</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Title</th>
            <th className="px-4 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-white/[0.02] group">
              <td className="px-4 py-3 text-white font-medium">{contact.full_name}</td>
              <td className="px-4 py-3 text-muted">
                {contact.crm_companies?.name || "—"}
              </td>
              <td className="px-4 py-3 text-muted">{contact.email || "—"}</td>
              <td className="px-4 py-3 text-muted">{contact.phone || "—"}</td>
              <td className="px-4 py-3 text-muted">{contact.job_title || "—"}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDelete(contact.id)}
                  disabled={deletingId === contact.id}
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-sm text-faint hover:text-danger hover:bg-danger/10 transition-all"
                  title="Delete contact"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
