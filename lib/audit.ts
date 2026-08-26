import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.generated";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "invite"
  | "role_change"
  | "export"
  | "password_reset";

/**
 * Fire-and-forget audit log entry. Call this from any server action where
 * you want a compliance record. Failures are swallowed so they never block
 * the real action.
 *
 * Usage:
 *   await auditLog({
 *     organizationId: ctx.organization.id,
 *     actorId: ctx.userId,
 *     action: "create",
 *     resourceType: "crm_deal",
 *     resourceId: deal.id,
 *     resourceName: deal.title,
 *   });
 */
export async function auditLog(params: {
  organizationId: string;
  actorId: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      organization_id: params.organizationId,
      actor_id: params.actorId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId ?? null,
      resource_name: params.resourceName ?? null,
      metadata: (params.metadata ?? {}) as Json,
      ip_address: params.ipAddress ?? null,
    });
  } catch {
    // Audit logging is best-effort; never throw from here.
  }
}
