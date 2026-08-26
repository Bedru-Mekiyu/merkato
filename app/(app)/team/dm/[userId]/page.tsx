import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { loadSidebarData, loadMemberNames } from "@/lib/team-data";
import { getOrCreateDM } from "@/app/(app)/team/actions";
import { ChatShell } from "@/components/team/chat-shell";
import { MessageThread } from "@/components/team/message-thread";
import type { Message } from "@/types/database";

export default async function DmPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: otherUserId } = await params;
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const result = await getOrCreateDM(otherUserId);
  if (result.error || !result.channelId) notFound();
  const channelId = result.channelId;

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", otherUserId)
    .single();

  const [{ data: messages }, sidebarData, memberNames] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true }),
    loadSidebarData(ctx.organization.id, ctx.userId),
    loadMemberNames(ctx.organization.id),
  ]);

  return (
    <ChatShell channels={sidebarData.channels} dms={sidebarData.dms}>
      <MessageThread
        channelId={channelId}
        channelLabel={otherProfile?.full_name || "Direct Message"}
        initialMessages={(messages ?? []) as Message[]}
        currentUserId={ctx.userId}
        memberNames={memberNames}
      />
    </ChatShell>
  );
}
