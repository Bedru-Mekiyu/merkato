import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { loadMemberNames } from "@/lib/team-data";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, DollarSign, Users, Activity } from "lucide-react";
import Link from "next/link";
import { IntroWalkthrough } from "@/components/dashboard/intro-walkthrough";
import { DashboardClusterWidget } from "@/components/cluster/cluster-widget";

export default async function DashboardPage() {
  const ctx = await requireOrgContext();
  const supabase = await createClient();
  const orgId = ctx.organization.id;

  const [openDeals, wonDeals, contactsCount, companiesCount, recentDeals, recentActivity, memberNames] =
    await Promise.all([
      supabase
        .from("crm_deals")
        .select("id, value", { count: "exact" })
        .eq("organization_id", orgId)
        .not("stage", "in", '("won","lost")'),
      supabase
        .from("crm_deals")
        .select("value")
        .eq("organization_id", orgId)
        .eq("stage", "won"),
      supabase
        .from("crm_contacts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
      supabase
        .from("crm_companies")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
      supabase
        .from("crm_deals")
        .select("id, title, value, stage, created_at, crm_companies(name)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("activity_log")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(6),
      loadMemberNames(orgId),
    ]);

  const openDealsCount = openDeals.count ?? 0;
  const openPipelineValue = (openDeals.data ?? []).reduce(
    (sum, d) => sum + Number(d.value ?? 0),
    0
  );
  const wonValue = (wonDeals.data ?? []).reduce(
    (sum, d) => sum + Number(d.value ?? 0),
    0
  );

  const firstName = ctx.profile?.full_name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="px-6 sm:px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          <span className="text-white">{greeting}, </span>
          <span className="bg-gradient-to-r from-primary via-primary-hover to-secondary bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-white/50 mt-1">
          Here&apos;s what&apos;s happening in {ctx.organization.name} today.
        </p>
      </div>

      {/* Intro & Quick-Start Walkthrough */}
      <IntroWalkthrough orgName={ctx.organization.name} />

      {/* Key metrics — 4 cards max, per "don't build a cockpit" principle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="animate-fade-in-up" style={{ animationDelay: "40ms" }}>
          <MetricCard
            label="Open Deals"
            value={openDealsCount.toString()}
            icon={Briefcase}
            tone="primary"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <MetricCard
            label="Open Pipeline"
            value={`$${openPipelineValue.toLocaleString()}`}
            icon={DollarSign}
            tone="emerald"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <MetricCard
            label="Won Revenue"
            value={`$${wonValue.toLocaleString()}`}
            icon={DollarSign}
            tone="amber"
          />
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <MetricCard
            label="Contacts"
            value={(contactsCount.count ?? 0).toString()}
            icon={Users}
            tone="sky"
          />
        </div>
      </div>

      <p className="text-xs text-white/40 mb-8 -mt-4 font-mono">
        {companiesCount.count ?? 0} companies tracked across active CRM shards
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-white/[0.08]">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Deals</h3>
            <Link href="/crm/deals" className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors">
              View all →
            </Link>
          </div>
          <CardContent className="p-0">
            {recentDeals.data && recentDeals.data.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {recentDeals.data.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-sm text-white font-medium">{deal.title}</p>
                      <p className="text-xs text-white/45">
                        {deal.crm_companies?.name ?? "No company"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white font-semibold font-mono">
                        ${Number(deal.value ?? 0).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-white/50 capitalize font-mono">
                        {String(deal.stage).replace("_", " ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Briefcase}
                title="No deals yet"
                description="Create your first deal to start tracking your pipeline."
                href="/crm/deals"
                ctaLabel="Go to pipeline"
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-white/[0.08]">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Activity</h3>
            <Link href="/team/activity" className="text-xs text-primary hover:text-primary-hover font-semibold transition-colors">
              View all →
            </Link>
          </div>
          <CardContent className="p-0">
            {recentActivity.data && recentActivity.data.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {recentActivity.data.map((entry) => {
                  const actorName = entry.actor_id ? memberNames[entry.actor_id] ?? "Someone" : "Someone";
                  return (
                    <div key={entry.id} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                      <div className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                        {actorName.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">
                        <span className="font-semibold text-white">{actorName}</span> {entry.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Activity}
                title="No activity yet"
                description="Actions across your workspace will show up here."
                href="/team/activity"
                ctaLabel="Open activity feed"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* High-Velocity Nodes Cluster Telemetry */}
      <DashboardClusterWidget />
    </div>
  );
}

const toneClasses: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/20 shadow-[0_0_12px_var(--primary-glow)]",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  amber: "bg-amber-500/10 text-amber-300 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
  sky: "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_12px_rgba(14,165,233,0.15)]",
};

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <Card className="hover:border-white/20 transition-all duration-200 h-full border-white/[0.08] bg-surface/75 backdrop-blur-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-[11px] font-bold text-white/50 uppercase tracking-wider mb-2">{label}</p>
          <p className="text-2xl font-bold text-white tracking-tight font-mono">{value}</p>
        </div>
        <div
          className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${toneClasses[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  ctaLabel = "View all",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <div className="h-12 w-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-3.5 shadow-sm">
        <Icon className="h-5 w-5 text-white/40" />
      </div>
      <p className="text-sm font-semibold text-white mb-1">{title}</p>
      <p className="text-xs text-white/60 mb-4 max-w-xs leading-relaxed">{description}</p>
      <Link href={href} className="text-xs text-primary hover:text-primary-hover font-semibold inline-flex items-center gap-1 transition-colors">
        <span>{ctaLabel}</span>
        <span>→</span>
      </Link>
    </div>
  );
}
