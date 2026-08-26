import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { TeamTabs } from "@/components/team/team-tabs";
import { ActivityFeed } from "@/components/team/activity-feed";
import { loadMemberNames } from "@/lib/team-data";
import type { ActivityLogEntry } from "@/types/database";

export default async function ActivityPage() {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const [{ data: entries }, memberNames] = await Promise.all([
    supabase
      .from("activity_log")
      .select("*")
      .eq("organization_id", ctx.organization.id)
      .order("created_at", { ascending: false })
      .limit(100),
    loadMemberNames(ctx.organization.id),
  ]);

  const formatted: ActivityLogEntry[] = (entries ?? []).map((e) => ({
    ...e,
    actor_name: e.actor_id ? memberNames[e.actor_id] ?? "Someone" : "Someone",
  })) as ActivityLogEntry[];

  return (
    <div>
      <TeamTabs />
      <div className="px-6 sm:px-8 py-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-white">Activity</h1>
          <p className="text-sm text-muted">
            Everything happening across {ctx.organization.name}
          </p>
        </div>
        <ActivityFeed entries={formatted} />
      </div>
    </div>
  );
}
