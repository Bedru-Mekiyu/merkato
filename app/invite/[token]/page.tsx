import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AcceptInviteClient } from "@/components/auth/accept-invite-client";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up the invitation (no RLS bypass needed — we query by token)
  const { data: invitation } = await supabase
    .from("invitations")
    .select("email, role, expires_at, accepted_at, organizations(name, slug)")
    .eq("token", token)
    .single();

  // Token doesn't exist at all
  if (!invitation) {
    return <InviteError message="This invitation link is invalid or has already been used." />;
  }

  // Already accepted
  if (invitation.accepted_at) {
    return <InviteError message="This invitation has already been accepted." />;
  }

  // Expired
  if (new Date(invitation.expires_at) < new Date()) {
    return <InviteError message="This invitation has expired. Ask the workspace owner to send a new one." />;
  }

  const org = invitation.organizations;

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in — redirect to signup with ?next= so they land here after
    redirect(`/signup?next=/invite/${token}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="h-12 w-12 rounded-md bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <div className="h-8 w-8 rounded-sm bg-accent flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1.5">You&apos;re invited</h1>
          <p className="text-sm text-muted">
            Join <strong className="text-white">{org?.name ?? "a workspace"}</strong> on Merkato
            as a <span className="capitalize text-white">{invitation.role}</span>.
          </p>
        </div>

        <AcceptInviteClient token={token} orgSlug={org?.slug ?? ""} />
      </div>
    </div>
  );
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="h-10 w-10 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-danger text-lg">!</span>
        </div>
        <p className="text-sm font-medium text-white mb-1">Invalid invitation</p>
        <p className="text-sm text-muted">{message}</p>
        <a href="/login" className="mt-4 inline-block text-sm text-accent hover:underline">
          Go to login
        </a>
      </div>
    </div>
  );
}
