import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { loadSidebarData, loadMemberNames } from "@/lib/team-data";
import { ChatShell } from "@/components/team/chat-shell";
import { MessageThread } from "@/components/team/message-thread";
import type { Message } from "@/types/database";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const supabase = await createClient();

  const { data: channel } = await supabase
    .from("channels")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.organization.id)
    .single();

  if (!channel) notFound();

  const [{ data: messages }, sidebarData, memberNames] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .eq("channel_id", id)
      .order("created_at", { ascending: true }),
    loadSidebarData(ctx.organization.id, ctx.userId),
    loadMemberNames(ctx.organization.id),
  ]);

  return (
    <ChatShell channels={sidebarData.channels} dms={sidebarData.dms}>
      <MessageThread
        channelId={id}
        channelLabel={`#${channel.name}`}
        initialMessages={(messages ?? []) as Message[]}
        currentUserId={ctx.userId}
        memberNames={memberNames}
      />
    </ChatShell>
  );
}
