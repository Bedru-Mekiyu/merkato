"use server";

import { createClient } from "@/lib/supabase/server";
import { requireOrgContext, requireStaffContext } from "@/lib/org-context";
import { logActivity } from "@/lib/activity";
import { notify } from "@/lib/notify";
import { sendEmail, appUrl } from "@/lib/email/client";
import { ticketReplyEmail, newTicketEmail } from "@/lib/email/templates";
import { revalidatePath } from "next/cache";
import type { TicketPriority, TicketStatus } from "@/types/database";

// ---------------------------------------------------------------------------
// Staff actions
// ---------------------------------------------------------------------------
export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .update({ status })
    .eq("id", ticketId)
    .select("subject")
    .single();

  if (error) return { error: error.message };

  if (status === "resolved") {
    await logActivity({
      organizationId: ctx.organization.id,
      actorId: ctx.userId,
      type: "ticket_resolved",
      summary: `resolved the ticket "${ticket?.subject ?? ""}"`,
      link: `/support/tickets/${ticketId}`,
    });
  }

  revalidatePath("/support");
  revalidatePath(`/support/tickets/${ticketId}`);
  return { success: true };
}

export async function updateTicketPriority(ticketId: string, priority: TicketPriority) {
  await requireStaffContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({ priority })
    .eq("id", ticketId);

  if (error) return { error: error.message };
  revalidatePath(`/support/tickets/${ticketId}`);
  return { success: true };
}

export async function assignTicket(ticketId: string, assigneeId: string | null) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .update({ assigned_to: assigneeId })
    .eq("id", ticketId)
    .select("subject")
    .single();

  if (error) return { error: error.message };

  if (assigneeId) {
    await notify({
      organizationId: ctx.organization.id,
      actorId: ctx.userId,
      recipientIds: [assigneeId],
      type: "ticket_assigned",
      title: "A ticket was assigned to you",
      body: `"${ticket?.subject ?? ""}" needs your attention.`,
      link: `/support/tickets/${ticketId}`,
    });

    await logActivity({
      organizationId: ctx.organization.id,
      actorId: ctx.userId,
      type: "ticket_assigned",
      summary: `assigned the ticket "${ticket?.subject ?? ""}"`,
      link: `/support/tickets/${ticketId}`,
    });
  }

  revalidatePath(`/support/tickets/${ticketId}`);
  revalidatePath("/support");
  return { success: true };
}

export async function staffReply(ticketId: string, formData: FormData) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const body = String(formData.get("body") ?? "").trim();
  const isInternalNote = formData.get("is_internal_note") === "on";
  if (!body) return { error: "Message cannot be empty." };

  const { error } = await supabase.from("ticket_messages").insert({
    organization_id: ctx.organization.id,
    ticket_id: ticketId,
    body,
    is_internal_note: isInternalNote,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };

  // Notify the customer when staff sends a non-internal reply
  if (!isInternalNote) {
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("customer_id, subject")
      .eq("id", ticketId)
      .single();

    if (ticket && ticket.customer_id !== ctx.userId) {
      // In-app notification
      await notify({
        organizationId: ctx.organization.id,
        actorId: ctx.userId,
        recipientIds: [ticket.customer_id],
        type: "ticket_reply",
        title: "New reply on your support request",
        body: `Someone replied to "${ticket.subject}".`,
        link: `/portal/${ctx.organization.slug}/tickets/${ticketId}`,
      });

      // Email notification via get_user_email() — SECURITY DEFINER function
      // added in 011_email_helpers.sql that reads auth.users safely.
      const { data: emailData } = await supabase
        .rpc("get_user_email", { p_user_id: ticket.customer_id });

      if (emailData) {
        await sendEmail({
          to: emailData as string,
          ...ticketReplyEmail({
            subject: ticket.subject,
            replyBody: body,
            ticketUrl: appUrl(`/portal/${ctx.organization.slug}/tickets/${ticketId}`),
            orgName: ctx.organization.name,
          }),
        });
      }
    }

    await supabase
      .from("support_tickets")
      .update({ status: "pending" })
      .eq("id", ticketId)
      .eq("status", "open");
  }

  revalidatePath(`/support/tickets/${ticketId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Customer-facing actions (used from the /portal routes)
// ---------------------------------------------------------------------------
export async function joinOrgAsCustomer(orgSlug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_org_as_customer", {
    org_slug: orgSlug,
  });

  if (error) return { error: error.message };
  return { success: true, organizationId: data as string };
}

export async function createTicket(orgSlug: string, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in to submit a request." };

  const joinResult = await joinOrgAsCustomer(orgSlug);
  if (joinResult.error || !joinResult.organizationId) {
    return { error: joinResult.error ?? "Could not find that support portal." };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;

  if (!subject) return { error: "Subject is required." };

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      organization_id: joinResult.organizationId,
      subject,
      description,
      category,
      customer_id: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Get the customer's display name for the notification email
  const { data: customerProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const customerName = customerProfile?.full_name ?? "A customer";

  await logActivity({
    organizationId: joinResult.organizationId,
    actorId: user.id,
    type: "ticket_created",
    summary: `submitted a support request: "${subject}"`,
    link: `/support/tickets/${ticket.id}`,
  });

  // Email all staff owners/admins about the new ticket (fire-and-forget)
  const { data: staffEmails } = await supabase
    .rpc("get_org_staff_emails", { p_org_id: joinResult.organizationId });

  if (staffEmails && Array.isArray(staffEmails)) {
    for (const email of staffEmails as string[]) {
      await sendEmail({
        to: email,
        ...newTicketEmail({
          customerName,
          subject,
          description,
          ticketUrl: appUrl(`/support/tickets/${ticket.id}`),
          orgName: orgSlug,
        }),
      });
    }
  }

  return { success: true, ticketId: ticket.id as string };
}

export async function customerReply(ticketId: string, formData: FormData) {
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Message cannot be empty." };

  const { error } = await supabase.from("ticket_messages").insert({
    organization_id: ctx.organization.id,
    ticket_id: ticketId,
    body,
    is_internal_note: false,
    created_by: ctx.userId,
  });

  if (error) return { error: error.message };

  // A customer reply on a resolved/pending ticket should reopen it.
  await supabase
    .from("support_tickets")
    .update({ status: "open" })
    .eq("id", ticketId)
    .in("status", ["pending", "resolved"]);

  revalidatePath(`/portal/${ctx.organization.slug}/tickets/${ticketId}`);
  return { success: true };
}
