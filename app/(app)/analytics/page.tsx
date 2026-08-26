import { requireStaffContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export default async function AnalyticsPage() {
  const ctx = await requireStaffContext();
  const supabase = await createClient();
  const orgId = ctx.organization.id;

  // Fetch all data in parallel
  const [
    { data: deals },
    { data: contacts },
    { data: companies },
    { data: tasks },
    { data: projects },
    { data: tickets },
    { data: articles },
    { data: members },
  ] = await Promise.all([
    supabase.from("crm_deals").select("id, value, stage, created_at").eq("organization_id", orgId),
    supabase.from("crm_contacts").select("id, created_at").eq("organization_id", orgId),
    supabase.from("crm_companies").select("id, created_at").eq("organization_id", orgId),
    supabase.from("project_tasks").select("id, status, priority, created_at, updated_at").eq("organization_id", orgId),
    supabase.from("projects").select("id, status, created_at").eq("organization_id", orgId),
    supabase.from("support_tickets").select("id, status, priority, created_at, updated_at").eq("organization_id", orgId),
    supabase.from("kb_articles").select("id, status, created_at").eq("organization_id", orgId),
    supabase.from("organization_members").select("user_id, role").eq("organization_id", orgId),
  ]);

  return (
    <AnalyticsDashboard
      deals={(deals ?? []).map((d) => ({ ...d, value: d.value ?? 0 }))}
      contacts={contacts ?? []}
      companies={companies ?? []}
      tasks={tasks ?? []}
      projects={projects ?? []}
      tickets={tickets ?? []}
      articles={articles ?? []}
      memberCount={(members ?? []).filter((m) => m.role !== "customer").length}
    />
  );
}
