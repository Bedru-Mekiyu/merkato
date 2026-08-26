"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Building2 } from "lucide-react";
import { deleteCompany } from "@/app/(app)/crm/actions";
import type { Company } from "@/types/database";

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteCompany(id);
    setDeletingId(null);
    router.refresh();
  }

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-16 border border-border rounded-md bg-surface">
        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <Building2 className="h-5 w-5 text-faint" />
        </div>
        <p className="text-sm font-medium text-white mb-1">No companies yet</p>
        <p className="text-xs text-muted">
          Add your first company to start organizing contacts and deals.
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
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Domain</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Industry</th>
            <th className="px-4 py-2.5 text-xs font-medium text-muted">Created</th>
            <th className="px-4 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {companies.map((company) => (
            <tr key={company.id} className="hover:bg-white/[0.02] group">
              <td className="px-4 py-3 text-white font-medium">{company.name}</td>
              <td className="px-4 py-3 text-muted">{company.domain || "—"}</td>
              <td className="px-4 py-3 text-muted">{company.industry || "—"}</td>
              <td className="px-4 py-3 text-muted">
                {new Date(company.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDelete(company.id)}
                  disabled={deletingId === company.id}
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-sm text-faint hover:text-danger hover:bg-danger/10 transition-all"
                  title="Delete company"
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
