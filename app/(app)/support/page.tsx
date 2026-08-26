import { requireStaffContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { loadMemberNames } from "@/lib/team-data";
import { TicketQueue } from "@/components/support/ticket-queue";
import type { SupportTicket } from "@/types/database";

export default async function SupportPage() {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const [{ data: tickets }, memberNames] = await Promise.all([
    supabase
      .from("support_tickets")
      .select("*, ticket_messages(id)")
      .eq("organization_id", ctx.organization.id)
      .order("created_at", { ascending: false }),
    loadMemberNames(ctx.organization.id),
  ]);

  const formatted: SupportTicket[] = (tickets ?? []).map((t) => ({
    ...t,
    ticket_messages: undefined,
    message_count: ((t.ticket_messages as { id: string }[]) ?? []).length,
    customer_name: memberNames[t.customer_id] ?? "Unknown",
    assignee_name: t.assigned_to ? memberNames[t.assigned_to] ?? "Unknown" : null,
  })) as SupportTicket[];

  return <TicketQueue tickets={formatted} orgSlug={ctx.organization.slug} />;
}
