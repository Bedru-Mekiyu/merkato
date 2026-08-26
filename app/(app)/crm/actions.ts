"use server";

import { createClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/org-context";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { DealStage } from "@/types/database";

// ---------------------------------------------------------------------------
// Companies
// ---------------------------------------------------------------------------
export async function createCompany(formData: FormData) {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const domain = String(formData.get("domain") ?? "").trim() || null;
  const industry = String(formData.get("industry") ?? "").trim() || null;

  if (!name) return { error: "Company name is required." };

  const { error } = await supabase.from("crm_companies").insert({
    organization_id: ctx.organization.id,
    name,
    domain,
    industry,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };

  await logActivity({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    type: "company_created",
    summary: `added the company ${name}`,
    link: "/crm/companies",
  });

  revalidatePath("/crm/companies");
  return { success: true };
}

export async function deleteCompany(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_companies").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/crm/companies");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------
export async function createContact(formData: FormData) {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const job_title = String(formData.get("job_title") ?? "").trim() || null;
  const company_id = String(formData.get("company_id") ?? "").trim() || null;

  if (!full_name) return { error: "Contact name is required." };

  const { error } = await supabase.from("crm_contacts").insert({
    organization_id: ctx.organization.id,
    full_name,
    email,
    phone,
    job_title,
    company_id,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };

  await logActivity({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    type: "contact_created",
    summary: `added the contact ${full_name}`,
    link: "/crm/contacts",
  });

  revalidatePath("/crm/contacts");
  return { success: true };
}

export async function deleteContact(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_contacts").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/crm/contacts");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------
export async function createDeal(formData: FormData) {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const value = Number(formData.get("value") ?? 0) || 0;
  const company_id = String(formData.get("company_id") ?? "").trim() || null;
  const contact_id = String(formData.get("contact_id") ?? "").trim() || null;
  const stage = (String(formData.get("stage") ?? "new_lead")) as DealStage;

  if (!title) return { error: "Deal title is required." };

  const { error } = await supabase.from("crm_deals").insert({
    organization_id: ctx.organization.id,
    title,
    value,
    company_id,
    contact_id,
    stage,
    owner_id: ctx.userId,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };

  await logActivity({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    type: "deal_created",
    summary: `created the deal "${title}"${value ? ` worth $${value.toLocaleString()}` : ""}`,
    link: "/crm/deals",
  });

  revalidatePath("/crm/deals");
  return { success: true };
}

export async function updateDealStage(dealId: string, stage: DealStage) {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const { data: deal, error } = await supabase
    .from("crm_deals")
    .update({ stage })
    .eq("id", dealId)
    .select("title")
    .single();

  if (error) return { error: error.message };

  const activityType = stage === "won" ? "deal_won" : stage === "lost" ? "deal_lost" : "deal_stage_changed";
  await logActivity({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    type: activityType,
    summary:
      stage === "won"
        ? `won the deal "${deal?.title ?? ""}" 🎉`
        : stage === "lost"
        ? `marked "${deal?.title ?? ""}" as lost`
        : `moved "${deal?.title ?? ""}" to ${stage.replace("_", " ")}`,
    link: "/crm/deals",
  });

  revalidatePath("/crm/deals");
  return { success: true };
}

export async function deleteDeal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("crm_deals").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/crm/deals");
  return { success: true };
}
