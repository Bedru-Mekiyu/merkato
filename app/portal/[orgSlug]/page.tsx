import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/support/portal-shell";
import { MyRequestsList } from "@/components/support/my-requests-list";
import type { SupportTicket } from "@/types/database";

export default async function PortalHomePage({
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
    redirect(`/login?next=/portal/${orgSlug}`);
  }

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("organization_id", org.id)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <PortalShell orgName={org.name} orgSlug={orgSlug}>
      <MyRequestsList tickets={(tickets ?? []) as SupportTicket[]} orgSlug={orgSlug} />
    </PortalShell>
  );
}
