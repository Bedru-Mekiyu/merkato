import { createClient } from "@/lib/supabase/server";
import { requireStaffContext } from "@/lib/org-context";
import { loadMemberNames } from "@/lib/team-data";
import { redirect } from "next/navigation";
import { Shield, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const actionBadge: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
  create: "success",
  update: "accent",
  delete: "danger",
  login: "default",
  logout: "default",
  invite: "accent",
  role_change: "warning",
  export: "warning",
  password_reset: "warning",
};

export default async function AuditLogPage() {
  const ctx = await requireStaffContext();

  // Only owners and admins can see the audit log
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    redirect("/settings");
  }

  const supabase = await createClient();

  const [{ data: logs }, memberNames] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("*")
      .eq("organization_id", ctx.organization.id)
      .order("created_at", { ascending: false })
      .limit(200),
    loadMemberNames(ctx.organization.id),
  ]);

  return (
    <div className="px-6 sm:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-md bg-accent/10 flex items-center justify-center">
          <Shield className="h-4 w-4 text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-white">Audit Log</h1>
          <p className="text-sm text-muted">
            Security and compliance event log — visible to owners and admins only
          </p>
        </div>
      </div>

      {(!logs || logs.length === 0) ? (
        <div className="flex flex-col items-center text-center py-16 border border-border rounded-md bg-surface">
          <ShieldAlert className="h-5 w-5 text-faint mb-2" />
          <p className="text-sm text-muted">No audit events recorded yet.</p>
          <p className="text-xs text-faint mt-1">
            Events are logged when members create, update, or delete workspace data.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-md bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Time</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Actor</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Action</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Resource</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white">
                    {log.actor_id ? memberNames[log.actor_id] ?? "Unknown" : "System"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={actionBadge[log.action] ?? "default"}
                      className="capitalize"
                    >
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white/70 capitalize">
                      {log.resource_type.replace(/_/g, " ")}
                    </span>
                    {log.resource_name && (
                      <span className="text-muted ml-1">· {log.resource_name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs max-w-xs truncate">
                    {log.ip_address && <span className="mr-2">{log.ip_address}</span>}
                    {log.metadata && Object.keys(log.metadata as object).length > 0 && (
                      <span className="font-mono">
                        {JSON.stringify(log.metadata).slice(0, 60)}
                        {JSON.stringify(log.metadata).length > 60 ? "…" : ""}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
