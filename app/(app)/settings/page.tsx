import { requireOrgContext } from "@/lib/org-context";
import { SettingsForm } from "@/components/layout/settings-form";

export default async function SettingsPage() {
  const ctx = await requireOrgContext();

  return (
    <div className="px-6 sm:px-8 py-8 max-w-2xl mx-auto">
      <h1 className="text-lg font-semibold text-white mb-6">Settings</h1>
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
