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
      <div className="px-6 sm:px-8 py-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-white">Directory</h1>
          <p className="text-sm text-muted">
            {formatted.length} member{formatted.length === 1 ? "" : "s"} in {ctx.organization.name}
          </p>
        </div>

        <DirectoryList members={formatted} currentUserId={ctx.userId} />

        <p className="text-xs text-faint mt-4">
          Want to add more people? Owners and admins can invite teammates by email from{" "}
          <a href="/settings/invites" className="text-accent hover:underline">
            Settings → Team Members &amp; Invitations
          </a>
          .
        </p>
      </div>
    </div>
  );
}
