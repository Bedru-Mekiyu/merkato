import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateWorkspaceForm } from "@/components/auth/create-workspace-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="h-10 w-10 rounded-sm bg-accent flex items-center justify-center text-white font-bold mx-auto mb-4">
            M
          </div>
          <h1 className="text-2xl font-bold text-white mb-1.5">
            Create your workspace
          </h1>
          <p className="text-sm text-muted">
            This is where your team, CRM, and projects will live.
          </p>
        </div>
        <CreateWorkspaceForm />
      </div>
    </div>
  );
}
