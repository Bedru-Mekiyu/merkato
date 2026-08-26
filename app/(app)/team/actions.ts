"use server";

import { createClient } from "@/lib/supabase/server";
import { requireStaffContext } from "@/lib/org-context";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------
export async function createChannel(formData: FormData) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Channel name is required." };

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      organization_id: ctx.organization.id,
      name,
      is_dm: false,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Creator auto-joins their own channel
  await supabase.from("channel_members").insert({
    channel_id: channel.id,
    organization_id: ctx.organization.id,
    user_id: ctx.userId,
  });

  revalidatePath("/team");
  return { success: true, channel };
}

/**
 * Finds an existing DM channel between the current user and another member,
 * or creates one. Returns the channel id either way.
 */
export async function getOrCreateDM(otherUserId: string) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const { data: targetMember } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", ctx.organization.id)
    .eq("user_id", otherUserId)
    .in("role", ["owner", "admin", "member"])
    .maybeSingle();

  if (!targetMember) {
    return { error: "That teammate is not part of this workspace." };
  }

  // Look for an existing DM channel containing exactly these two members.
  const { data: myChannels } = await supabase
    .from("channel_members")
    .select("channel_id, channels!inner(is_dm)")
    .eq("user_id", ctx.userId)
    .eq("channels.is_dm", true);

  for (const row of myChannels ?? []) {
    const { data: members } = await supabase
      .from("channel_members")
      .select("user_id")
      .eq("channel_id", row.channel_id);

    const ids = (members ?? []).map((m) => m.user_id);
    if (ids.length === 2 && ids.includes(otherUserId)) {
      return { success: true, channelId: row.channel_id as string };
    }
  }

  // None found — create a new DM channel.
  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      organization_id: ctx.organization.id,
      name: null,
      is_dm: true,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error || !channel) return { error: error?.message ?? "Could not create DM." };

  const { error: membersError } = await supabase.from("channel_members").insert([
    { channel_id: channel.id, organization_id: ctx.organization.id, user_id: ctx.userId },
    { channel_id: channel.id, organization_id: ctx.organization.id, user_id: otherUserId },
  ]);

  if (membersError) {
    await supabase.from("channels").delete().eq("id", channel.id);
    return { error: membersError.message };
  }

  return { success: true, channelId: channel.id as string };
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
export async function sendMessage(channelId: string, formData: FormData) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Message cannot be empty." };

  const { data: message, error } = await supabase.from("messages").insert({
    organization_id: ctx.organization.id,
    channel_id: channelId,
    body,
    created_by: ctx.userId,
  }).select().single();

  if (error) return { error: error.message };

  await logActivity({
    organizationId: ctx.organization.id,
    actorId: ctx.userId,
    type: "message_sent",
    summary: `sent a message`,
    link: "/team",
  });

  revalidatePath("/team");
  return { success: true, message };
}
