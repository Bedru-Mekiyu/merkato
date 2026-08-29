import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { TeamTabs } from "@/components/team/team-tabs";
import { DirectoryList } from "@/components/team/directory-list";

export default async function DirectoryPage() {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("organization_members")
    .select("id, role, user_id, profiles(full_name, avatar_url)")
    .eq("organization_id", ctx.organization.id);

  const formatted = (members ?? []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    role: m.role,
    name: m.profiles?.full_name || "Unnamed user",
  }));

  return (
    <div>
      <TeamTabs />
      <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Team Directory</h1>
            <p className="text-xs text-white/50 mt-0.5">
              {formatted.length} verified member{formatted.length === 1 ? "" : "s"} in {ctx.organization.name}
            </p>
          </div>
          <a
            href="/settings/invites"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-xs font-semibold text-white hover:bg-white/[0.08] transition-colors"
          >
            + Invite Teammates
          </a>
        </div>

        <DirectoryList members={formatted} currentUserId={ctx.userId} />
      </div>
    </div>
  );
}
