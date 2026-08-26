import { createClient } from "@/lib/supabase/server";
import type { Channel } from "@/types/database";

/**
 * Loads the data needed to render the channel sidebar: all org-wide
 * channels, plus the current user's DM channels (resolved to the other
 * participant's display name).
 */
export async function loadSidebarData(organizationId: string, userId: string) {
  const supabase = await createClient();

  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_dm", false)
    .order("created_at", { ascending: true });

  const { data: myDmMemberships } = await supabase
    .from("channel_members")
    .select("channel_id, channels!inner(is_dm)")
    .eq("user_id", userId)
    .eq("channels.is_dm", true);

  const dms: { userId: string; name: string }[] = [];

  for (const row of myDmMemberships ?? []) {
    const { data: otherMembers } = await supabase
      .from("channel_members")
      .select("user_id, profiles(full_name)")
      .eq("channel_id", row.channel_id)
      .neq("user_id", userId);

    const other = (otherMembers ?? [])[0];
    if (other) {
      const profile = other.profiles;
      dms.push({
        userId: other.user_id,
        name: profile?.full_name || "Unnamed user",
      });
    }
  }

  return {
    channels: (channels ?? []) as Channel[],
    dms,
  };
}

/**
 * Builds a map of userId -> display name for all org members, used to
 * label messages in a thread.
 */
export async function loadMemberNames(organizationId: string): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, profiles(full_name)")
    .eq("organization_id", organizationId);

  const map: Record<string, string> = {};
  for (const m of members ?? []) {
    const profile = m.profiles;
    map[m.user_id] = profile?.full_name || "Unnamed user";
  }
  return map;
}
