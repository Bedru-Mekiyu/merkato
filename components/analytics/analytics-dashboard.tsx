"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, DonutChart } from "@/components/analytics/charts";
import { ClusterTopology } from "@/components/cluster/cluster-topology";

type Tab = "business" | "team" | "support" | "cluster";

// helpers
function last30days() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
}

function monthLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short" });
}

function groupByMonth<T extends { created_at: string }>(items: T[]) {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    map.set(d.toLocaleDateString(undefined, { month: "short" }), 0);
  }
  for (const item of items) {
    const label = monthLabel(item.created_at);
    if (map.has(label)) map.set(label, (map.get(label) ?? 0) + 1);
  }
  return Array.from(map, ([label, value]) => ({ label, value }));
}

export function AnalyticsDashboard({
  deals,
  contacts,
  companies,
  tasks,
  projects,
  tickets,
  articles,
  memberCount,
}: {
  deals: { id: string; value: string | number; stage: string; created_at: string }[];
  contacts: { id: string; created_at: string }[];
  companies: { id: string; created_at: string }[];
  tasks: { id: string; status: string; priority: string; created_at: string; updated_at: string }[];
  projects: { id: string; status: string; created_at: string }[];
  tickets: { id: string; status: string; priority: string; created_at: string; updated_at: string }[];
  articles: { id: string; status: string; created_at: string }[];
  memberCount: number;
}) {
  const [tab, setTab] = useState<Tab>("business");

  // --- Business metrics ---
  const totalPipelineValue = useMemo(
    () => deals.filter((d) => !["won", "lost"].includes(d.stage))
      .reduce((s, d) => s + Number(d.value ?? 0), 0),
    [deals]
  );
  const wonValue = useMemo(
    () => deals.filter((d) => d.stage === "won").reduce((s, d) => s + Number(d.value ?? 0), 0),
    [deals]
  );
  const conversionRate = deals.length
    ? Math.round((deals.filter((d) => d.stage === "won").length / deals.length) * 100)
    : 0;
  const dealsThisMonth = deals.filter((d) => new Date(d.created_at) >= last30days()).length;
  const dealsByStage = [
    { label: "New Lead", value: deals.filter((d) => d.stage === "new_lead").length, color: "#6366F1" },
    { label: "Contacted", value: deals.filter((d) => d.stage === "contacted").length, color: "#8B5CF6" },
    { label: "Qualified", value: deals.filter((d) => d.stage === "qualified").length, color: "#A78BFA" },
    { label: "Proposal", value: deals.filter((d) => d.stage === "proposal").length, color: "#F59E0B" },
    { label: "Won", value: deals.filter((d) => d.stage === "won").length, color: "#22C55E" },
    { label: "Lost", value: deals.filter((d) => d.stage === "lost").length, color: "#EF4444" },
  ].filter((d) => d.value > 0);

  const dealsOverTime = groupByMonth(deals);
  const contactsOverTime = groupByMonth(contacts);

  // --- Team metrics ---
  const tasksCompleted = tasks.filter((t) => t.status === "done").length;
  const tasksOpen = tasks.filter((t) => t.status !== "done").length;
  const projectsActive = projects.filter((p) => p.status === "active").length;
  const tasksByStatus = [
    { label: "To Do", value: tasks.filter((t) => t.status === "todo").length, color: "#6366F1" },
    { label: "In Progress", value: tasks.filter((t) => t.status === "in_progress").length, color: "#F59E0B" },
    { label: "Review", value: tasks.filter((t) => t.status === "review").length, color: "#8B5CF6" },
    { label: "Done", value: tasks.filter((t) => t.status === "done").length, color: "#22C55E" },
  ].filter((d) => d.value > 0);
  const tasksByPriority = [
    { label: "Urgent", value: tasks.filter((t) => t.priority === "urgent").length, color: "#EF4444" },
    { label: "High", value: tasks.filter((t) => t.priority === "high").length, color: "#F59E0B" },
    { label: "Medium", value: tasks.filter((t) => t.priority === "medium").length, color: "#6366F1" },
    { label: "Low", value: tasks.filter((t) => t.priority === "low").length, color: "#6B7280" },
  ].filter((d) => d.value > 0);

  // --- Support metrics ---
  const openTickets = tickets.filter((t) => t.status === "open").length;
  const resolvedTickets = tickets.filter((t) => t.status === "resolved").length;
  const resolutionRate = tickets.length
    ? Math.round((resolvedTickets / tickets.length) * 100)
    : 0;
  const ticketsByStatus = [
    { label: "Open", value: tickets.filter((t) => t.status === "open").length, color: "#6366F1" },
    { label: "Pending", value: tickets.filter((t) => t.status === "pending").length, color: "#F59E0B" },
    { label: "Resolved", value: tickets.filter((t) => t.status === "resolved").length, color: "#22C55E" },
    { label: "Closed", value: tickets.filter((t) => t.status === "closed").length, color: "#6B7280" },
  ].filter((d) => d.value > 0);
  const ticketsByPriority = [
    { label: "Urgent", value: tickets.filter((t) => t.priority === "urgent").length, color: "#EF4444" },
    { label: "High", value: tickets.filter((t) => t.priority === "high").length, color: "#F59E0B" },
    { label: "Medium", value: tickets.filter((t) => t.priority === "medium").length, color: "#6366F1" },
    { label: "Low", value: tickets.filter((t) => t.priority === "low").length, color: "#6B7280" },
  ].filter((d) => d.value > 0);
  const ticketsOverTime = groupByMonth(tickets);

  return (
    <div className="px-6 sm:px-8 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-white">Analytics</h1>
          <p className="text-sm text-muted">Real-time insights across your workspace</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-6 border border-border rounded-sm p-1 w-fit bg-surface">
        {(
          [
            { id: "business", label: "Business & Revenue" },
            { id: "team", label: "Team Execution" },
            { id: "support", label: "Customer Support" },
            { id: "cluster", label: "Nodes Cluster" },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95",
              tab === t.id
                ? "bg-primary text-white shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/[0.05]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cluster" && (
        <div className="space-y-6 animate-fade-in-up">
          <ClusterTopology />
        </div>
      )}

      {tab === "business" && (
        <div className="space-y-4">
          {/* Key metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Open Pipeline" value={`$${totalPipelineValue.toLocaleString()}`} />
            <StatCard label="Won Revenue" value={`$${wonValue.toLocaleString()}`} />
            <StatCard label="Conversion Rate" value={`${conversionRate}%`} />
            <StatCard label="New Deals (30d)" value={dealsThisMonth.toString()} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Deals Created (6 months)</CardTitle></CardHeader>
              <CardContent><BarChart data={dealsOverTime} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Pipeline by Stage</CardTitle></CardHeader>
              <CardContent><DonutChart segments={dealsByStage} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>New Contacts (6 months)</CardTitle></CardHeader>
              <CardContent><BarChart data={contactsOverTime} color="#22C55E" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>CRM Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Row label="Total deals" value={deals.length} />
                  <Row label="Total contacts" value={contacts.length} />
                  <Row label="Total companies" value={companies.length} />
                  <Row label="KB articles" value={articles.filter((a) => a.status === "published").length} note="published" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "team" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Active Projects" value={projectsActive.toString()} />
            <StatCard label="Tasks Open" value={tasksOpen.toString()} />
            <StatCard label="Tasks Done" value={tasksCompleted.toString()} />
            <StatCard label="Team Members" value={memberCount.toString()} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Tasks by Status</CardTitle></CardHeader>
              <CardContent><DonutChart segments={tasksByStatus} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Tasks by Priority</CardTitle></CardHeader>
              <CardContent><DonutChart segments={tasksByPriority} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Tasks Created (6 months)</CardTitle></CardHeader>
              <CardContent><BarChart data={groupByMonth(tasks)} color="#8B5CF6" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Projects Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(["active", "on_hold", "completed", "archived"] as const).map((s) => (
                    <Row
                      key={s}
                      label={s.replace("_", " ")}
                      value={projects.filter((p) => p.status === s).length}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "support" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Open Tickets" value={openTickets.toString()} />
            <StatCard label="Resolved" value={resolvedTickets.toString()} />
            <StatCard label="Resolution Rate" value={`${resolutionRate}%`} />
            <StatCard label="Total Tickets" value={tickets.length.toString()} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Tickets by Status</CardTitle></CardHeader>
              <CardContent><DonutChart segments={ticketsByStatus} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Tickets by Priority</CardTitle></CardHeader>
              <CardContent><DonutChart segments={ticketsByPriority} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Tickets Created (6 months)</CardTitle></CardHeader>
              <CardContent><BarChart data={ticketsOverTime} color="#F59E0B" /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Support Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Row label="Open" value={tickets.filter((t) => t.status === "open").length} />
                  <Row label="Pending" value={tickets.filter((t) => t.status === "pending").length} />
                  <Row label="Resolved" value={tickets.filter((t) => t.status === "resolved").length} />
                  <Row label="Closed" value={tickets.filter((t) => t.status === "closed").length} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted capitalize">{label}{note ? ` (${note})` : ""}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
