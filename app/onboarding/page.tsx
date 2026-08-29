import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateWorkspaceForm } from "@/components/auth/create-workspace-form";
import { MerkatoMark } from "@/components/ui/brand-logo";

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background selection:bg-primary/30">
      <div className="w-full max-w-[380px] animate-fade-in-up">
        <div className="rounded-xl border border-white/[0.08] bg-surface p-6 sm:p-7 shadow-xl">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Create workspace
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Choose a name for your team or organization.
            </p>
          </div>
          <CreateWorkspaceForm />
        </div>
      </div>
    </div>
  );
}
