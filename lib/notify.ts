import { createClient } from "@/lib/supabase/server";

export type NotificationType =
  | "task_assigned"
  | "task_due_soon"
  | "mention"
  | "ticket_assigned"
  | "ticket_reply"
  | "deal_won"
  | "project_invite"
  | "team_invite"
  | "system";

/**
 * Create an in-app notification for one or more recipients.
 * Fire-and-forget — failures are swallowed so they never block the caller.
 *
 * Usage:
 *   await notify({
 *     organizationId: ctx.organization.id,
 *     actorId: ctx.userId,
 *     recipientIds: [assigneeId],
 *     type: "task_assigned",
 *     title: "You were assigned a task",
 *     body: `"${task.title}" was assigned to you.`,
 *     link: `/projects/${projectId}`,
 *   });
 */
export async function notify(params: {
  organizationId: string;
  actorId: string;
  recipientIds: string[];
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  // Don't notify the actor themselves
  const recipients = params.recipientIds.filter((id) => id !== params.actorId);
  if (!recipients.length) return;

  try {
    const supabase = await createClient();
    await supabase.from("notifications").insert(
      recipients.map((recipientId) => ({
        organization_id: params.organizationId,
        recipient_id: recipientId,
        actor_id: params.actorId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        link: params.link ?? null,
      }))
    );
  } catch {
    // Best-effort; never throw
  }
}
