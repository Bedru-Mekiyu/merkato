import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/support/portal-shell";
import { NewTicketForm } from "@/components/support/new-ticket-form";

export default async function NewTicketPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .single();

  if (!org) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/portal/${orgSlug}/new`);
  }

  return (
    <PortalShell orgName={org.name} orgSlug={orgSlug}>
      <NewTicketForm orgSlug={orgSlug} />
    </PortalShell>
  );
}
