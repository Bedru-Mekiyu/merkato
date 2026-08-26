import { requireStaffContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InvitesManager } from "@/components/auth/invites-manager";

export default async function InvitesPage() {
  const ctx = await requireStaffContext();

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    redirect("/settings");
  }

  const supabase = await createClient();

  const { data: invitations } = await supabase
    .from("invitations")
    .select("*")
    .eq("organization_id", ctx.organization.id)
    .order("created_at", { ascending: false });

  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, role, profiles(full_name)")
    .eq("organization_id", ctx.organization.id);

  const formattedMembers = (members ?? []).map((m) => ({
    userId: m.user_id,
    role: m.role,
    name: m.profiles?.full_name ?? "Unnamed",
  }));

  return (
    <div className="px-6 sm:px-8 py-8 max-w-3xl mx-auto">
      <h1 className="text-lg font-semibold text-white mb-1.5">Team Members &amp; Invitations</h1>
      <p className="text-sm text-muted mb-8">
        Invite people to join <strong className="text-white">{ctx.organization.name}</strong>.
        They&apos;ll receive an email with a link to accept.
      </p>
      <InvitesManager
        invitations={invitations ?? []}
        members={formattedMembers}
        orgName={ctx.organization.name}
      />
    </div>
  );
}
