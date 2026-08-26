"use server";

import { createClient } from "@/lib/supabase/server";
import { requireStaffContext } from "@/lib/org-context";
import { auditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const full_name = String(formData.get("full_name") ?? "").trim();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name })
    .eq("id", ctx.userId);

  if (error) return { error: error.message };

  await auditLog({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    action: "update",
    resourceType: "profile",
    resourceId: ctx.userId,
    resourceName: full_name,
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updateWorkspace(formData: FormData) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return { error: "Only owners and admins can update workspace settings." };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Workspace name is required." };

  const { error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", ctx.organization.id);

  if (error) return { error: error.message };

  await auditLog({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    action: "update",
    resourceType: "organization",
    resourceId: ctx.organization.id,
    resourceName: name,
    metadata: { field: "name", new_value: name },
  });

  revalidatePath("/settings");
  return { success: true };
}
