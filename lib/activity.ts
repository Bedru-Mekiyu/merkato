import { createClient } from "@/lib/supabase/server";
import type { ActivityType } from "@/types/database";

/**
 * Fire-and-forget activity log insert. Called from server actions across
 * every module (CRM, Projects, Support, etc.) so the activity feed reflects
 * real workspace events. Failures here are swallowed — logging activity
 * should never block or break the action that triggered it.
 */
export async function logActivity(params: {
  organizationId: string;
  actorId: string;
  type: ActivityType;
  summary: string;
  link?: string;
}) {
  try {
    const supabase = await createClient();
    await supabase.from("activity_log").insert({
      organization_id: params.organizationId,
      actor_id: params.actorId,
      type: params.type,
      summary: params.summary,
      link: params.link ?? null,
    });
  } catch {
    // Activity logging is best-effort; never throw from here.
  }
}
