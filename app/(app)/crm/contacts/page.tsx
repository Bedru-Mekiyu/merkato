import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { CrmTabs } from "@/components/crm/crm-tabs";
import { ContactsTable } from "@/components/crm/contacts-table";
import { NewContactButton } from "@/components/crm/new-contact-button";

export default async function ContactsPage() {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const [{ data: contacts }, { data: companies }] = await Promise.all([
    supabase
      .from("crm_contacts")
      .select("*, crm_companies(name)")
      .eq("organization_id", ctx.organization.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("crm_companies")
      .select("id, name")
      .eq("organization_id", ctx.organization.id)
      .order("name"),
  ]);

  return (
    <div>
      <CrmTabs />
      <div className="px-6 sm:px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-white">Contacts</h1>
            <p className="text-sm text-muted">
              {contacts?.length ?? 0} contacts in your workspace
            </p>
          </div>
          <NewContactButton companies={companies ?? []} />
        </div>

        <ContactsTable contacts={contacts ?? []} />
      </div>
    </div>
  );
}
