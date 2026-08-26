import { TeamTabs } from "@/components/team/team-tabs";
import { ChannelSidebar } from "@/components/team/channel-sidebar";
import type { Channel } from "@/types/database";

export function ChatShell({
  channels,
  dms,
  children,
}: {
  channels: Channel[];
  dms: { userId: string; name: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <TeamTabs />
      <div className="flex flex-1 min-h-0">
        <ChannelSidebar channels={channels} dms={dms} />
        {children}
      </div>
    </div>
  );
}
