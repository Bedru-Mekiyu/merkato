import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  DealStage,
  TaskStatus,
  TaskPriority,
  TicketStatus,
  TicketPriority,
  ArticleStatus,
} from "@/types/database";

export const dynamic = "force-dynamic";

const DEMO_COMPANIES = [
  { name: "Acme Enterprises", domain: "acme.com" },
  { name: "Stripe Inc.", domain: "stripe.com" },
  { name: "Vercel Platform", domain: "vercel.com" },
  { name: "Linear Systems", domain: "linear.app" },
  { name: "Nordic Retail Group", domain: "nordicretail.se" },
];

const DEMO_CONTACTS = [
  { full_name: "Sarah Chen", email: "sarah.chen@acme.com", job_title: "VP of Engineering" },
  { full_name: "Marcus Brody", email: "marcus@stripe.com", job_title: "Head of Partnerships" },
  { full_name: "Elena Rostova", email: "elena@vercel.com", job_title: "Infrastructure Lead" },
  { full_name: "David Kim", email: "david.kim@linear.app", job_title: "Chief Product Officer" },
];

const DEMO_DEALS: { title: string; value: number; stage: DealStage }[] = [
  { title: "Enterprise Platform License", value: 85000, stage: "proposal" },
  { title: "Global Cloud Migration", value: 64000, stage: "qualified" },
  { title: "Multi-Tenant Integration", value: 45000, stage: "won" },
  { title: "Security SLA Upgrade", value: 28000, stage: "contacted" },
  { title: "Dedicated Support Retainer", value: 36000, stage: "new_lead" },
  { title: "Legacy Stack Replacement", value: 52000, stage: "proposal" },
];

const DEMO_PROJECT_NAME = "Q3 Engineering & Product Sprint";
const DEMO_PROJECT_DESC = "Core platform scalability, enterprise security hardening, and high-contrast theme engine.";

const DEMO_TASKS: {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  description: string;
  subtasks: string[];
}[] = [
  {
    title: "Postgres RLS index tuning for sub-10ms queries",
    status: "in_progress",
    priority: "urgent",
    description: "Audit explain analyze outputs for all organization-scoped queries.",
    subtasks: ["Add composite index on (organization_id, created_at)", "Verify RLS bypass security tests"],
  },
  {
    title: "Implement TOTP MFA second-factor challenge",
    status: "done",
    priority: "high",
    description: "Enforce AAL2 security checks on sensitive workspace administration actions.",
    subtasks: ["Generate QR secret", "Store encrypted recovery backup codes", "Add session step-up guard"],
  },
  {
    title: "Design 2026 Bento Grid marketing surface",
    status: "done",
    priority: "medium",
    description: "Build responsive high-contrast showcase with interactive Q&A assistant.",
    subtasks: ["8-pillar layout", "Live platform Q&A demo", "Capabilities matrix"],
  },
  {
    title: "Dual-surfaced customer support portal",
    status: "in_progress",
    priority: "high",
    description: "Cryptographically isolate internal notes from external customer portal sessions.",
    subtasks: ["Build portal shell", "Add ticket reply thread", "Test RLS policy blocking"],
  },
  {
    title: "S3 Document Drive versioning and signed URLs",
    status: "review",
    priority: "medium",
    description: "Implement 1-hour expiration download signatures and document rollback.",
    subtasks: ["Bucket policy setup", "Version archiving trigger", "UI folder navigation"],
  },
  {
    title: "Zero-dependency hand-rolled SVG analytics",
    status: "todo",
    priority: "low",
    description: "Build lightweight line and donut charts for business revenue and sprint velocity.",
    subtasks: ["SVG donut math", "Tooltip interactivity", "Responsive viewBox"],
  },
];

const DEMO_TICKETS: {
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
}[] = [
  {
    subject: "Inquiry about custom SSO SAML configuration",
    category: "Technical Issue",
    priority: "high",
    status: "open",
    description: "Our enterprise compliance team requires SAML 2.0 single sign-on with Okta. What is the setup procedure?",
  },
  {
    subject: "Requesting VAT invoice for annual billing",
    category: "Billing",
    priority: "medium",
    status: "resolved",
    description: "Please provide the official invoice with our EU VAT ID included.",
  },
  {
    subject: "Customer portal webhook notifications",
    category: "Feature Request",
    priority: "low",
    status: "pending",
    description: "Is it possible to receive an outbound HTTP webhook when a support ticket status changes to resolved?",
  },
];

const DEMO_ARTICLES: {
  title: string;
  status: ArticleStatus;
  content: string;
}[] = [
  {
    title: "Postgres Row-Level Security & Multi-Tenancy Architecture",
    status: "published",
    content: `# Postgres Row-Level Security & Multi-Tenancy Architecture

Merkato provides enterprise-grade data isolation using **PostgreSQL Row-Level Security (RLS)**.

## Key Principles
1. **Engine-Level Isolation:** Data separation is enforced by Postgres policies, not application code.
2. **Cryptographic Identity:** Every query is verified against the authenticated user's organization membership.
3. **Internal Note Shielding:** Staff internal notes are physically invisible to external customer portal queries.

## Compliance
- Meets SOC2 and GDPR tenant isolation requirements.
- Zero risk of cross-tenant data leaks.`,
  },
  {
    title: "Customer Support Portal & SLA Management",
    status: "published",
    content: `# Customer Support Portal & SLA Management

Learn how to manage inbound support tickets and configure your organization's public customer hub.

## Accessing the Customer Portal
Your external clients can access their dedicated portal at:
\`https://merkato.app/portal/[orgSlug]\`

## Features
- **Ticket Submission:** Clean form with category and description fields.
- **Real-Time Replies:** Customers receive updates without viewing internal staff discussions.
- **SLA Priority Queues:** Triage high and urgent tickets directly from the internal queue.`,
  },
];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization_id, organizations(id, name)")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.organization_id) {
    return NextResponse.json(
      { error: "Only workspace owners and admins can seed demo data." },
      { status: 403 }
    );
  }

  const orgId = membership.organization_id;
  const payload = await req.json().catch(() => ({}));
  const action = payload.action ?? "seed";

  if (action === "clear") {
    await Promise.all([
      supabase.from("crm_deals").delete().eq("organization_id", orgId),
      supabase.from("crm_contacts").delete().eq("organization_id", orgId),
      supabase.from("crm_companies").delete().eq("organization_id", orgId),
      supabase.from("project_tasks").delete().eq("organization_id", orgId),
      supabase.from("projects").delete().eq("organization_id", orgId),
      supabase.from("support_tickets").delete().eq("organization_id", orgId),
      supabase.from("kb_articles").delete().eq("organization_id", orgId),
    ]);

    await supabase.from("activity_log").insert({
      organization_id: orgId,
      type: "project_created",
      actor_id: user.id,
      summary: "cleared demo data from the workspace",
    });

    return NextResponse.json({ success: true, message: "Workspace data cleared successfully." });
  }

  // 1. Seed Companies
  const companyInserts = DEMO_COMPANIES.map((c) => ({
    organization_id: orgId,
    name: c.name,
    domain: c.domain,
  }));
  const { data: insertedCompanies } = await supabase
    .from("crm_companies")
    .insert(companyInserts)
    .select("id, name");

  const companyMap = new Map((insertedCompanies ?? []).map((c) => [c.name, c.id]));

  // 2. Seed Contacts
  const contactInserts = DEMO_CONTACTS.map((c) => ({
    organization_id: orgId,
    full_name: c.full_name,
    email: c.email,
    job_title: c.job_title,
    company_id: companyMap.get("Acme Enterprises") ?? null,
  }));
  await supabase.from("crm_contacts").insert(contactInserts);

  // 3. Seed CRM Deals
  const dealInserts = DEMO_DEALS.map((d, idx) => ({
    organization_id: orgId,
    title: d.title,
    value: d.value,
    stage: d.stage,
    company_id: insertedCompanies?.[idx % (insertedCompanies.length || 1)]?.id ?? null,
  }));
  await supabase.from("crm_deals").insert(dealInserts);

  // 4. Seed Sprint Project & Tasks
  const { data: project } = await supabase
    .from("projects")
    .insert({
      organization_id: orgId,
      name: DEMO_PROJECT_NAME,
      description: DEMO_PROJECT_DESC,
      status: "active",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (project) {
    for (let i = 0; i < DEMO_TASKS.length; i++) {
      const t = DEMO_TASKS[i];
      const { data: createdTask } = await supabase
        .from("project_tasks")
        .insert({
          organization_id: orgId,
          project_id: project.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          position: i,
          created_by: user.id,
          assignee_id: user.id,
        })
        .select("id")
        .single();

      if (createdTask && t.subtasks?.length) {
        const subtaskInserts = t.subtasks.map((stTitle, stIdx) => ({
          organization_id: orgId,
          task_id: createdTask.id,
          title: stTitle,
          is_done: stIdx === 0,
          position: stIdx,
        }));
        await supabase.from("task_subtasks").insert(subtaskInserts);
      }
    }
  }

  // 5. Seed Support Tickets
  const ticketInserts = DEMO_TICKETS.map((t) => ({
    organization_id: orgId,
    subject: t.subject,
    category: t.category,
    priority: t.priority,
    status: t.status,
    description: t.description,
    customer_id: user.id,
    assigned_to: user.id,
  }));
  await supabase.from("support_tickets").insert(ticketInserts);

  // 6. Seed Knowledge Base Articles
  const articleInserts = DEMO_ARTICLES.map((a) => ({
    organization_id: orgId,
    title: a.title,
    content: a.content,
    status: a.status,
    created_by: user.id,
  }));
  await supabase.from("kb_articles").insert(articleInserts);

  // 7. Log Activity
  await supabase.from("activity_log").insert({
    organization_id: orgId,
    type: "deal_created",
    actor_id: user.id,
    summary: "generated realistic demo data for CRM, Sprints, Support, and Knowledge Base",
  });

  return NextResponse.json({
    success: true,
    message: "Realistic demo workspace data seeded successfully!",
  });
}
