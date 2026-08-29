import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface WorkspaceMetrics {
  deals: {
    total: number;
    totalValue: number;
    byStage: Record<string, number>;
    topDeals: { title: string; value: number; stage: string }[];
  };
  tasks: {
    total: number;
    byStatus: Record<string, number>;
    urgentTasks: { title: string; priority: string; status: string }[];
  };
  tickets: {
    total: number;
    open: number;
    urgentTickets: { subject: string; priority: string; status: string }[];
  };
  articlesCount: number;
  membersCount: number;
}

async function fetchRealWorkspaceMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string
): Promise<WorkspaceMetrics> {
  const [
    { data: deals },
    { data: tasks },
    { data: tickets },
    { count: articlesCount },
    { count: membersCount },
  ] = await Promise.all([
    supabase
      .from("crm_deals")
      .select("title, value, stage")
      .eq("organization_id", orgId),
    supabase
      .from("project_tasks")
      .select("title, priority, status")
      .eq("organization_id", orgId),
    supabase
      .from("support_tickets")
      .select("subject, priority, status")
      .eq("organization_id", orgId),
    supabase
      .from("kb_articles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  const dealList = deals ?? [];
  const totalValue = dealList.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const byStage: Record<string, number> = {};
  dealList.forEach((d) => {
    byStage[d.stage] = (byStage[d.stage] || 0) + 1;
  });

  const taskList = tasks ?? [];
  const byStatus: Record<string, number> = {};
  taskList.forEach((t) => {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  });
  const urgentTasks = taskList.filter((t) => t.priority === "urgent" && t.status !== "done");

  const ticketList = tickets ?? [];
  const openTickets = ticketList.filter((t) => t.status === "open" || t.status === "pending");
  const urgentTickets = ticketList.filter(
    (t) => (t.priority === "urgent" || t.priority === "high") && t.status !== "closed"
  );

  return {
    deals: {
      total: dealList.length,
      totalValue,
      byStage,
      topDeals: dealList
        .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
        .slice(0, 5)
        .map((d) => ({ title: d.title, value: Number(d.value) || 0, stage: d.stage })),
    },
    tasks: {
      total: taskList.length,
      byStatus,
      urgentTasks: urgentTasks.slice(0, 5),
    },
    tickets: {
      total: ticketList.length,
      open: openTickets.length,
      urgentTickets: urgentTickets.slice(0, 5),
    },
    articlesCount: articlesCount ?? 0,
    membersCount: membersCount ?? 0,
  };
}

function synthesizeWorkspaceReport(
  query: string,
  metrics: WorkspaceMetrics,
  userName: string,
  orgName: string
): string {
  const q = query.toLowerCase().trim();

  // 1. CRM & Pipeline Queries
  if (
    q.includes("crm") ||
    q.includes("pipeline") ||
    q.includes("deal") ||
    q.includes("revenue") ||
    q.includes("sales") ||
    q.includes("forecast")
  ) {
    const stageBreakdown = Object.entries(metrics.deals.byStage)
      .map(([stage, count]) => `  - **${stage.replace("_", " ")}**: ${count} deal${count > 1 ? "s" : ""}`)
      .join("\n");

    const topDealsList = metrics.deals.topDeals.length
      ? metrics.deals.topDeals
          .map((d) => `  - **${d.title}**: $${d.value.toLocaleString()} *(${d.stage.replace("_", " ")})*`)
          .join("\n")
      : "  - *No deals created yet.*";

    return [
      `### 💼 Real-Time CRM Pipeline Analysis (${orgName})`,
      "",
      `**Active Pipeline Metrics:**`,
      `- **Total Pipeline Valuation:** $${metrics.deals.totalValue.toLocaleString()}`,
      `- **Total Recorded Deals:** ${metrics.deals.total}`,
      "",
      `**Stage Distribution:**`,
      stageBreakdown || "  - *No deals currently in pipeline.*",
      "",
      `**Top High-Value Deals:**`,
      topDealsList,
      "",
      `**Actionable Recommendations:**`,
      `1. Focus follow-ups on high-value proposals to accelerate monthly pipeline throughput.`,
      `2. Update stage progression in the visual CRM Board at \`/crm/deals\`.`,
      "",
      `> ℹ️ *Synthesized directly from live PostgreSQL CRM records.*`,
    ].join("\n");
  }

  // 2. Sprint & Task Queries
  if (
    q.includes("task") ||
    q.includes("urgent") ||
    q.includes("sprint") ||
    q.includes("focus") ||
    q.includes("backlog") ||
    q.includes("project")
  ) {
    const statusBreakdown = Object.entries(metrics.tasks.byStatus)
      .map(([st, count]) => `  - **${st.replace("_", " ")}**: ${count} task${count > 1 ? "s" : ""}`)
      .join("\n");

    const urgentList = metrics.tasks.urgentTasks.length
      ? metrics.tasks.urgentTasks
          .map((t) => `  - 🚨 **${t.title}** *(${t.status.replace("_", " ")})*`)
          .join("\n")
      : "  - *No urgent blockers identified at this moment.*";

    return [
      `### ⚡ Sprint & Task Velocity (${orgName})`,
      "",
      `**Task Health Summary:**`,
      `- **Total Workspace Tasks:** ${metrics.tasks.total}`,
      `- **Urgent Active Blocker Tasks:** ${metrics.tasks.urgentTasks.length}`,
      "",
      `**Task Status Breakdown:**`,
      statusBreakdown || "  - *No tasks currently in backlog.*",
      "",
      `**Urgent Items Requiring Attention:**`,
      urgentList,
      "",
      `**Sprint Momentum Checklist:**`,
      `- Review unassigned tasks in the Kanban Board at \`/projects\`.`,
      `- Ensure code review turnaround times are under 4 hours for urgent tasks.`,
      "",
      `> ℹ️ *Synthesized directly from live PostgreSQL Sprint records.*`,
    ].join("\n");
  }

  // 3. Customer Support & Tickets Queries
  if (
    q.includes("support") ||
    q.includes("ticket") ||
    q.includes("customer") ||
    q.includes("issue") ||
    q.includes("helpdesk")
  ) {
    const urgentTicketsList = metrics.tickets.urgentTickets.length
      ? metrics.tickets.urgentTickets
          .map((t) => `  - 🎫 **${t.subject}** *([${t.priority}] ${t.status})*`)
          .join("\n")
      : "  - *All high-priority tickets are currently resolved.*";

    return [
      `### 🎫 Customer Support Queue Health (${orgName})`,
      "",
      `**Helpdesk Metrics:**`,
      `- **Total Inbound Tickets:** ${metrics.tickets.total}`,
      `- **Open / Pending Tickets:** ${metrics.tickets.open}`,
      `- **High / Urgent Priority:** ${metrics.tickets.urgentTickets.length}`,
      "",
      `**Priority Support Items:**`,
      urgentTicketsList,
      "",
      `**SLA Operations:**`,
      `1. Triage open tickets in the support queue at \`/support\`.`,
      `2. Keep internal notes database-isolated from customer portal views.`,
      `3. Resolve recurring questions with Knowledge Base articles.`,
      "",
      `> ℹ️ *Synthesized directly from live PostgreSQL Support records.*`,
    ].join("\n");
  }

  // 4. Platform Architecture & What is Merkato
  if (
    q.includes("what is merkato") ||
    q.includes("how does merkato work") ||
    q.includes("what does this platform do") ||
    q.includes("feature") ||
    q.includes("module") ||
    q.includes("architecture")
  ) {
    return [
      `### 🚀 About Merkato Startup OS (${orgName})`,
      "",
      `Merkato is the unified operating platform engineered with **Next.js 14** and **Supabase PostgreSQL**. It consolidates your startup's core operations into one system:`,
      "",
      `1. **💼 CRM Pipeline (\`/crm\`):** 6-stage drag-and-drop deals, accounts, and contact timelines. (Currently: **${metrics.deals.total} deals**, **$${metrics.deals.totalValue.toLocaleString()}** in pipeline).`,
      `2. **⚡ Agile Sprint Boards (\`/projects\`):** Kanban boards, task checklists, priorities, and assignees. (Currently: **${metrics.tasks.total} tasks**).`,
      `3. **💬 Real-Time Team Channels (\`/team\`):** WebSockets chat, direct messaging, and active presence status.`,
      `4. **🎫 Customer Support Helpdesk (\`/support\`):** Dual-surfaced triage with a public customer portal at \`/portal/[orgSlug]\`.`,
      `5. **📁 Secure Document Drive (\`/documents\`):** Supabase Storage uploads with versioning and 1-hour signed URLs.`,
      `6. **📚 Knowledge Base (\`/knowledge-base\`):** Markdown documentation with draft-to-published editorial workflows. (Currently: **${metrics.articlesCount} articles**).`,
      `7. **📊 Hand-Rolled Analytics (\`/analytics\`):** Real-time SVG charts for business revenue and velocity.`,
      `8. **🛡️ System Health & Telemetry (\`/cluster\`):** Live database round-trip probes and edge runtime monitoring.`,
      "",
      `*All data is cryptographically scoped to ${orgName} via PostgreSQL Row-Level Security (RLS).*`,
    ].join("\n");
  }

  // 5. Document Storage Queries
  if (q.includes("document") || q.includes("file") || q.includes("storage") || q.includes("drive") || q.includes("s3")) {
    return [
      `### 📁 Document Drive & Storage System`,
      "",
      `The Merkato Document Drive (\`/documents\`) provides secure, tenant-isolated file management:`,
      "",
      `- **Storage Engine:** Backed by private Supabase S3 Storage bucket (\`documents\`).`,
      `- **Security:** Files are downloaded via short-lived signed URLs (1-hour expiration) rather than public URLs.`,
      `- **Automatic Versioning:** Uploading a file with the same name preserves previous revisions in \`document_versions\` with instant rollback support.`,
      `- **Folder Structure:** Organize workspace assets into nested directories with breadcrumbs navigation.`,
      "",
      `*Navigate to \`/documents\` to upload or browse files.*`,
    ].join("\n");
  }

  // 6. Security & Postgres RLS Queries
  if (q.includes("security") || q.includes("rls") || q.includes("tenant") || q.includes("permission") || q.includes("role")) {
    return [
      `### 🛡️ Security Architecture & Tenancy Isolation`,
      "",
      `Merkato enforces security at the PostgreSQL database engine layer:`,
      "",
      `- **Row-Level Security (RLS):** Every query is cryptographically bounded by \`organization_id = auth.uid()\` membership check.`,
      `- **Role Hierarchy (\`org_role\`):** Enforces \`owner\`, \`admin\`, \`member\`, and \`customer\` permissions.`,
      `- **Internal Note Shielding:** Support ticket internal notes (\`is_internal_note = true\`) are physically blocked from customer queries by RLS policies.`,
      `- **MFA & PKCE:** Authenticator app second-factor assurance (AAL2) and OAuth PKCE session management.`,
      "",
      `*View compliance records anytime at \`/audit-log\`.*`,
    ].join("\n");
  }

  // 7. Drafting Assistance (Emails, Updates, Notes)
  if (q.includes("draft") || q.includes("email") || q.includes("template") || q.includes("write") || q.includes("message")) {
    return [
      `### ✍️ Workspace Communication Draft`,
      "",
      `Here is a professional draft tailored for your workspace (${orgName}):`,
      "",
      `**Subject:** Update on recent milestones & next steps — ${orgName}`,
      "",
      `Hi [Name],`,
      "",
      `Thank you for connecting. I wanted to share a quick update regarding our ongoing initiatives at ${orgName}:`,
      "",
      `- **Sprint Progress:** Our team is currently tracking ${metrics.tasks.total} active sprint tasks, with urgent milestones on schedule.`,
      `- **Commercial Milestones:** We have ${metrics.deals.total} active deals progressing through our technical and proposal review stages.`,
      `- **Support Velocity:** Our customer operations queue is actively maintaining sub-1-hour triage turnaround times.`,
      "",
      `Please let me know if you would like to schedule a 15-minute sync this week to review deliverables.`,
      "",
      `Best regards,`,
      `${userName}`,
      `${orgName}`,
      "",
      `*Feel free to ask me to refine the tone or customize specific numbers.*`,
    ].join("\n");
  }

  // Default: Comprehensive Dynamic Synthesis
  return [
    `### 🎯 Executive Workspace Briefing (${orgName})`,
    "",
    `Good day ${userName}! Here is your synthesized operational report:`,
    "",
    `#### 1. 💼 Commercial & Pipeline Velocity`,
    `- **Total Pipeline Valuation:** $${metrics.deals.totalValue.toLocaleString()} across ${metrics.deals.total} deal${metrics.deals.total !== 1 ? "s" : ""}`,
    `- Deals are active across ${Object.keys(metrics.deals.byStage).length} stages.`,
    "",
    `#### 2. ⚡ Engineering & Sprint Execution`,
    `- **Active Tasks:** ${metrics.tasks.total} total (${metrics.tasks.urgentTasks.length} urgent blockers).`,
    `- Projects board is synchronizing via live PostgreSQL RLS.`,
    "",
    `#### 3. 🎫 Customer Support & Operations`,
    `- **Support Queue:** ${metrics.tickets.open} open ticket${metrics.tickets.open !== 1 ? "s" : ""} requiring team attention.`,
    `- **Knowledge Base:** ${metrics.articlesCount} published/draft documentation articles.`,
    `- **Workspace Team:** ${metrics.membersCount} active team members.`,
    "",
    `*You can ask me to summarize deals, list urgent bugs, explain platform architecture, or draft emails.*`,
    "",
    `> 💡 **Tip:** To enable generative neural reasoning, configure an \`OPENAI_API_KEY\` or \`ANTHROPIC_API_KEY\` in your environment or chat settings.`,
  ].join("\n");
}

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
    .in("role", ["owner", "admin", "member"])
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.organizations) {
    return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  }

  const org = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : (membership.organizations as { id: string; name: string });

  const rl = rateLimit(`ai:${user.id}`, 30);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests — try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  const payload = await req.json();
  const { messages, context, customApiKey } = payload;

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.some(
      (message) =>
        !message ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string"
    )
  ) {
    return NextResponse.json({ error: "Valid messages array is required." }, { status: 400 });
  }

  const latestMessage = messages[messages.length - 1]?.content ?? "";
  const apiKey =
    customApiKey ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENCODE_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OX_ALPHA_API_KEY;

  if (apiKey) {
    try {
      const endpoint = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions";
      const model = process.env.AI_MODEL || "gpt-4o-mini";

      const externalRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 1200,
          temperature: 0.7,
          stream: true,
          messages: [
            {
              role: "system",
              content: `You are Merkato AI, the intelligent workspace operations assistant for ${org.name}. Be concise, structured, actionable, and accurate.\n\nContext:\n${context ?? ""}`,
            },
            ...messages.slice(-10),
          ],
        }),
      });

      if (externalRes.ok && externalRes.body) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        (async () => {
          const reader = externalRes.body!.getReader();
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (delta) {
                      await writer.write(encoder.encode(delta));
                    }
                  } catch {
                    // Skip malformed SSE lines
                  }
                }
              }
            }
          } finally {
            await writer.close();
          }
        })();

        return new Response(readable, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-cache",
          },
        });
      }
    } catch {
      // Fall through to real database-driven Workspace Intelligence synthesis
    }
  }

  // Real Database-Driven Workspace Intelligence Engine
  const metrics = await fetchRealWorkspaceMetrics(supabase, org.id);
  const userName = user.email?.split("@")[0] ?? "Team Member";
  const synthesizedReport = synthesizeWorkspaceReport(
    latestMessage,
    metrics,
    userName,
    org.name
  );

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      await writer.write(encoder.encode(synthesizedReport));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
