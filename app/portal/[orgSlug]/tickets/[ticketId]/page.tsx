import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/support/portal-shell";
import { TicketDetail } from "@/components/support/ticket-detail";
import type { SupportTicket, TicketMessage } from "@/types/database";

export default async function PortalTicketDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; ticketId: string }>;
}) {
  const { orgSlug, ticketId } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .single();

  if (!org) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/portal/${orgSlug}/tickets/${ticketId}`);
  }

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("organization_id", org.id)
    .eq("customer_id", user.id)
    .single();

  if (!ticket) notFound();

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  return (
    <PortalShell orgName={org.name} orgSlug={orgSlug}>
      <TicketDetail
        ticket={ticket as SupportTicket}
        messages={(messages ?? []) as TicketMessage[]}
        currentUserId={user.id}
        isStaffView={false}
        backHref={`/portal/${orgSlug}`}
      />
    </PortalShell>
  );
}
