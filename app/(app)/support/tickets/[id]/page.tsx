import { notFound } from "next/navigation";
import { requireStaffContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { loadMemberNames } from "@/lib/team-data";
import { TicketDetail } from "@/components/support/ticket-detail";
import type { SupportTicket, TicketMessage } from "@/types/database";

export default async function StaffTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.organization.id)
    .single();

  if (!ticket) notFound();

  const [{ data: messages }, { data: members }] = await Promise.all([
    supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("organization_members")
      .select("user_id, role, profiles(full_name)")
      .eq("organization_id", ctx.organization.id)
      .in("role", ["owner", "admin", "member"]),
  ]);

  const memberNames = await loadMemberNames(ctx.organization.id);
  const staffMembers = (members ?? []).map((m) => ({
    id: m.user_id,
    name: m.profiles?.full_name || "Unnamed",
  }));

  const formattedTicket: SupportTicket = {
    ...ticket,
    customer_name: memberNames[ticket.customer_id] ?? "Unknown",
    assignee_name: ticket.assigned_to ? memberNames[ticket.assigned_to] ?? "Unknown" : null,
  };

  const formattedMessages: TicketMessage[] = (messages ?? []).map((m) => ({
    ...m,
    author_name: m.created_by ? memberNames[m.created_by] ?? "Unknown" : "Unknown",
  }));

  return (
    <TicketDetail
      ticket={formattedTicket}
      messages={formattedMessages}
      staffMembers={staffMembers}
      currentUserId={ctx.userId}
      isStaffView
    />
  );
}
