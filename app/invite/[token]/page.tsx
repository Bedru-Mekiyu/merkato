import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AcceptInviteClient } from "@/components/auth/accept-invite-client";
import { MerkatoMark } from "@/components/ui/brand-logo";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/signup?next=/invite/${token}`);
  }

  // The token lookup is intentionally exposed only to authenticated users.
  const { data: invitations } = await supabase.rpc("get_invitation_by_token", {
    p_token: token,
  });
  const invitation = invitations?.[0];

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background selection:bg-primary/30">
      <div className="w-full max-w-[380px] animate-fade-in-up">
        <div className="rounded-xl border border-white/[0.08] bg-surface p-6 sm:p-7 shadow-xl">
          <div className="mb-5 text-center">
            <h1 className="text-lg font-semibold text-white tracking-tight">You&apos;re invited</h1>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">
              Join <strong className="text-white font-medium">{invitation.organization_name}</strong> as a{" "}
              <span className="capitalize text-white">{invitation.role}</span>.
            </p>
          </div>

          <AcceptInviteClient token={token} orgSlug={invitation.organization_slug} />

          <p className="mt-4 text-[11px] text-white/40 text-center">
            Signed in as <span className="text-white/60">{user.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="rounded-2xl border border-white/10 bg-surface/90 backdrop-blur-md p-8 text-center shadow-2xl">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
            !
          </div>
          <h2 className="text-lg font-bold text-white mb-1.5">Invalid Invitation</h2>
          <p className="text-sm text-white/60 leading-relaxed">{message}</p>
          <a href="/login" className="mt-6 inline-flex items-center justify-center text-xs font-semibold text-primary hover:text-primary-hover">
            ← Return to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
