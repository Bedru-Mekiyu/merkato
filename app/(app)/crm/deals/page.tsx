import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { CrmTabs } from "@/components/crm/crm-tabs";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { NewDealButton } from "@/components/crm/new-deal-button";
import type { Deal } from "@/types/database";

export default async function DealsPage() {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const [{ data: deals }, { data: companies }, { data: contacts }] =
    await Promise.all([
      supabase
        .from("crm_deals")
        .select("*, crm_companies(name), crm_contacts(full_name)")
        .eq("organization_id", ctx.organization.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("crm_companies")
        .select("id, name")
        .eq("organization_id", ctx.organization.id)
        .order("name"),
      supabase
        .from("crm_contacts")
        .select("id, full_name")
        .eq("organization_id", ctx.organization.id)
        .order("full_name"),
    ]);

  const totalValue = (deals ?? []).reduce(
    (sum, d) => sum + Number(d.value ?? 0),
    0
  );

  return (
    <div>
      <CrmTabs />
      <div className="px-6 sm:px-8 py-6">
        <div className="flex items-center justify-between mb-5 max-w-6xl mx-auto">
          <div>
            <h1 className="text-lg font-semibold text-white">Pipeline</h1>
            <p className="text-sm text-muted">
              {deals?.length ?? 0} deals · ${totalValue.toLocaleString()} total value
            </p>
          </div>
          <NewDealButton companies={companies ?? []} contacts={contacts ?? []} />
        </div>

        <PipelineBoard deals={(deals ?? []) as Deal[]} />
      </div>
    </div>
  );
}
