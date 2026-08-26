import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Organization, OrgRole, Profile } from "@/types/database";

export interface CurrentUserContext {
  userId: string;
  email: string | null;
  profile: Profile | null;
  organization: Organization;
  role: OrgRole;
}

/**
 * Use at the top of any protected page. Redirects to /login if not
 * authenticated, and to /onboarding if the user has no organization yet.
 */
export async function requireOrgContext(): Promise<CurrentUserContext> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organizations(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership || !membership.organizations) {
    redirect("/onboarding");
  }

  // redirect() throws, so TypeScript doesn't narrow past it automatically —
  // these checks are unreachable at runtime but satisfy the type checker.
  if (!membership || !membership.organizations) {
    throw new Error("Unreachable: redirected to /onboarding");
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: (profile as Profile) ?? null,
    organization: membership.organizations as unknown as Organization,
    role: membership.role as OrgRole,
  };
}

/**
 * Use at the top of internal-app pages (dashboard, CRM, projects, team,
 * knowledge base, support staff views, settings). Customers should never
 * see these — they get redirected to their support portal instead.
 */
export async function requireStaffContext(): Promise<CurrentUserContext> {
  const ctx = await requireOrgContext();
  if (ctx.role === "customer") {
    redirect(`/portal/${ctx.organization.slug}`);
  }
  return ctx;
}
