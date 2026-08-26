import { requireOrgContext } from "@/lib/org-context";
import { loadSidebarData } from "@/lib/team-data";
import { ChatShell } from "@/components/team/chat-shell";
import { MessageSquare } from "lucide-react";

export default async function TeamChatHomePage() {
  const ctx = await requireOrgContext();
  const { channels, dms } = await loadSidebarData(ctx.organization.id, ctx.userId);

  return (
    <ChatShell channels={channels} dms={dms}>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <MessageSquare className="h-5 w-5 text-faint" />
        </div>
        <p className="text-sm font-medium text-white mb-1">
          {channels.length > 0 ? "Pick a channel to get started" : "No channels yet"}
        </p>
        <p className="text-xs text-muted max-w-xs">
          {channels.length > 0
            ? "Select a channel from the sidebar, or message a teammate from the Directory."
            : "Create your first channel using the + button in the sidebar."}
        </p>
      </div>
    </ChatShell>
  );
}
