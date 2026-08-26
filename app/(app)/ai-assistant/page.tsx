import { requireStaffContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { AiChat } from "@/components/ai-assistant/ai-chat";

export default async function AiAssistantPage() {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  // Gather live workspace context to inject into the system prompt
  const [openDeals, activeTasks, openTickets, recentActivity] = await Promise.all([
    supabase
      .from("crm_deals")
      .select("title, value, stage")
      .eq("organization_id", ctx.organization.id)
      .not("stage", "in", '("won","lost")')
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("project_tasks")
      .select("title, status, priority")
      .eq("organization_id", ctx.organization.id)
      .not("status", "eq", "done")
      .eq("priority", "urgent")
      .limit(5),
    supabase
      .from("support_tickets")
      .select("subject, status, priority")
      .eq("organization_id", ctx.organization.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("activity_log")
      .select("summary, created_at")
      .eq("organization_id", ctx.organization.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const context = [
    `Organization: ${ctx.organization.name}`,
    `User: ${ctx.profile?.full_name ?? "Team member"} (${ctx.role})`,
    "",
    openDeals.data?.length
      ? `Open deals (${openDeals.data.length}):\n${openDeals.data.map((d) => `  - ${d.title}: $${Number(d.value).toLocaleString()} (${d.stage})`).join("\n")}`
      : "No open deals.",
    "",
    activeTasks.data?.length
      ? `Urgent open tasks (${activeTasks.data.length}):\n${activeTasks.data.map((t) => `  - [${t.priority}] ${t.title}`).join("\n")}`
      : "No urgent tasks.",
    "",
    openTickets.data?.length
      ? `Open support tickets (${openTickets.data.length}):\n${openTickets.data.map((t) => `  - ${t.subject} (${t.priority})`).join("\n")}`
      : "No open support tickets.",
    "",
    recentActivity.data?.length
      ? `Recent activity:\n${recentActivity.data.map((a) => `  - ${a.summary}`).join("\n")}`
      : "",
  ].join("\n");

  const suggestedPrompts = [
    "Summarize what's happening in our CRM pipeline",
    "What urgent tasks should the team focus on?",
    "Are there any open support tickets that need attention?",
    "Give me a weekly status report based on recent activity",
    "What should I prioritize today?",
  ];

  return (
    <AiChat
      userName={ctx.profile?.full_name ?? "there"}
      context={context}
      suggestedPrompts={suggestedPrompts}
    />
  );
}
