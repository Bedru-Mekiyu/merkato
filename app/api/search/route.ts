import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import type { SearchResultsGroup } from "@/lib/search";

export const dynamic = "force-dynamic";

const LIMIT_PER_TYPE = 4;

/** PostgREST filter values can't contain reserved characters — keep it simple. */
function sanitize(q: string): string {
  return q.replace(/[,()%\\]/g, " ").trim();
}

/**
 * Workspace-wide search across CRM, Projects, Knowledge Base and Support.
 * Authenticated staff only — RLS additionally scopes every query to the
 * caller's organization at the database level.
 */
export async function GET(request: NextRequest) {
  const q = sanitize(request.nextUrl.searchParams.get("q") ?? "");

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Authenticated users get a generous per-minute budget keyed by user id
  const rl = rateLimit(`search:${user.id}`, 60);
  if (!rl.ok) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  if (q.length < 2) {
    return Response.json({ groups: [] });
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return Response.json({ error: "No organization" }, { status: 403 });
  }
  const orgId = membership.organization_id as string;

  const pattern = `%${q}%`;

  const [
    companies,
    contacts,
    deals,
    articles,
    projects,
    tasks,
    tickets,
  ] = await Promise.all([
    supabase
      .from("crm_companies")
      .select("id, name, domain")
      .eq("organization_id", orgId)
      .ilike("name", pattern)
      .limit(LIMIT_PER_TYPE),
    supabase
      .from("crm_contacts")
      .select("id, full_name, email")
      .eq("organization_id", orgId)
      .ilike("full_name", pattern)
      .limit(LIMIT_PER_TYPE),
    supabase
      .from("crm_deals")
      .select("id, title, value, stage")
      .eq("organization_id", orgId)
      .ilike("title", pattern)
      .limit(LIMIT_PER_TYPE),
    supabase
      .from("kb_articles")
      .select("id, title, status")
      .eq("organization_id", orgId)
      .ilike("title", pattern)
      .limit(LIMIT_PER_TYPE),
    supabase
      .from("projects")
      .select("id, name, status")
      .eq("organization_id", orgId)
      .ilike("name", pattern)
      .limit(LIMIT_PER_TYPE),
    supabase
      .from("project_tasks")
      .select("id, title, project_id")
      .eq("organization_id", orgId)
      .ilike("title", pattern)
      .limit(LIMIT_PER_TYPE),
    supabase
      .from("support_tickets")
      .select("id, subject, status")
      .eq("organization_id", orgId)
      .ilike("subject", pattern)
      .limit(LIMIT_PER_TYPE),
  ]);

  const groups: SearchResultsGroup[] = [
    {
      type: "company",
      label: "Companies",
      items: (companies.data ?? []).map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: (c.domain as string | null) ?? undefined,
        href: "/crm/companies",
      })),
    },
    {
      type: "contact",
      label: "Contacts",
      items: (contacts.data ?? []).map((c) => ({
        id: c.id,
        title: c.full_name ?? "Unnamed contact",
        subtitle: (c.email as string | null) ?? undefined,
        href: "/crm/contacts",
      })),
    },
    {
      type: "deal",
      label: "Deals",
      items: (deals.data ?? []).map((d) => ({
        id: d.id,
        title: d.title,
        subtitle: d.value ? `$${Number(d.value).toLocaleString()}` : String(d.stage).replace("_", " "),
        href: "/crm/deals",
      })),
    },
    {
      type: "article",
      label: "Knowledge Base",
      items: (articles.data ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        subtitle: a.status === "published" ? "Published" : "Draft",
        href: `/knowledge-base/${a.id}`,
      })),
    },
    {
      type: "project",
      label: "Projects",
      items: (projects.data ?? []).map((p) => ({
        id: p.id,
        title: p.name,
        href: `/projects/${p.id}`,
      })),
    },
    {
      type: "task",
      label: "Tasks",
      items: (tasks.data ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        href: `/projects/${(t.project_id as string) ?? ""}`,
      })),
    },
    {
      type: "ticket",
      label: "Support Tickets",
      items: (tickets.data ?? []).map((t) => ({
        id: t.id,
        title: t.subject,
        subtitle: String(t.status).replace("_", " "),
        href: `/support/tickets/${t.id}`,
      })),
    },
  ].filter((g) => g.items.length > 0);

  return Response.json({ groups });
}
