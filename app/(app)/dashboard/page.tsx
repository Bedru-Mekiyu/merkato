import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { loadMemberNames } from "@/lib/team-data";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, DollarSign, Users, Activity } from "lucide-react";
import Link from "next/link";

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
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-white">{greeting}, </span>
          <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>
        <p className="text-sm text-muted mt-1">
          Here&apos;s what&apos;s happening in {ctx.organization.name} today.
        </p>
      </div>

      {/* Key metrics — 4 cards max, per "don't build a cockpit" principle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="animate-fade-in-up" style={{ animationDelay: "40ms" }}>
          <MetricCard
            label="Open Deals"
            value={openDealsCount.toString()}
            icon={Briefcase}
            tone="indigo"
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

      <p className="text-xs text-faint mb-8 -mt-4">
        {companiesCount.count ?? 0} companies tracked
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Deals</h3>
            <Link href="/crm/deals" className="text-xs text-accent hover:text-accent-hover">
              View all
            </Link>
          </div>
          <CardContent className="p-0">
            {recentDeals.data && recentDeals.data.length > 0 ? (
              <div className="divide-y divide-border">
                {recentDeals.data.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm text-white font-medium">{deal.title}</p>
                      <p className="text-xs text-muted">
                        {deal.crm_companies?.name ?? "No company"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white font-medium">
                        ${Number(deal.value ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted capitalize">
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

        <Card>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            <Link href="/team/activity" className="text-xs text-accent hover:text-accent-hover">
              View all
            </Link>
          </div>
          <CardContent className="p-0">
            {recentActivity.data && recentActivity.data.length > 0 ? (
              <div className="divide-y divide-border">
                {recentActivity.data.map((entry) => {
                  const actorName = entry.actor_id ? memberNames[entry.actor_id] ?? "Someone" : "Someone";
                  return (
                    <div key={entry.id} className="flex items-start gap-2.5 px-4 py-2.5">
                      <div className="h-5 w-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[9px] font-medium text-accent shrink-0 mt-0.5">
                        {actorName.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">
                        <span className="font-medium text-white">{actorName}</span> {entry.summary}
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
    </div>
  );
}

const toneClasses: Record<string, string> = {
  indigo: "bg-accent/10 text-accent",
  emerald: "bg-success/10 text-success",
  amber: "bg-warning/10 text-warning",
  sky: "bg-sky-400/10 text-sky-400",
};

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <Card className="hover:border-white/[0.08] h-full">
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted mb-1.5">{label}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        </div>
        <div
          className={`h-8 w-8 rounded-sm flex items-center justify-center shrink-0 ${toneClasses[tone]}`}
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
      <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-faint" />
      </div>
      <p className="text-sm font-medium text-white mb-1">{title}</p>
      <p className="text-xs text-muted mb-4 max-w-xs">{description}</p>
      <Link href={href} className="text-xs text-accent hover:text-accent-hover font-medium">
        {ctaLabel} →
      </Link>
    </div>
  );
}
