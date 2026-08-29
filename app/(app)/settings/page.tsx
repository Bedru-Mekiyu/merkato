import { requireOrgContext } from "@/lib/org-context";
import { SettingsForm } from "@/components/layout/settings-form";

export default async function SettingsPage() {
  const ctx = await requireOrgContext();

  return (
    <div className="px-4 sm:px-8 py-8 max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Settings &amp; Workspace Profile
        </h1>
        <p className="text-xs sm:text-sm text-white/60 mt-1">
          Configure personal preferences, organization branding, color themes, and security policies for {ctx.organization.name}.
        </p>
      </div>

      <SettingsForm
        fullName={ctx.profile?.full_name ?? ""}
        email={ctx.email ?? ""}
        orgName={ctx.organization.name}
        orgSlug={ctx.organization.slug}
        role={ctx.role}
      />
    </div>
  );
}
