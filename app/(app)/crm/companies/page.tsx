import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { CrmTabs } from "@/components/crm/crm-tabs";
import { CompaniesTable } from "@/components/crm/companies-table";
import { NewCompanyButton } from "@/components/crm/new-company-button";

export default async function CompaniesPage() {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from("crm_companies")
    .select("*")
    .eq("organization_id", ctx.organization.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <CrmTabs />
      <div className="px-6 sm:px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-white">Companies</h1>
            <p className="text-sm text-muted">
              {companies?.length ?? 0} companies in your workspace
            </p>
          </div>
          <NewCompanyButton />
        </div>

        <CompaniesTable companies={companies ?? []} />
      </div>
    </div>
  );
}
