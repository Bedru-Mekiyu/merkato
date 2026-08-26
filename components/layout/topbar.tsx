import Link from "next/link";
import { Sparkles } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell, type NotificationItem } from "@/components/layout/notification-bell";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/layout/command-palette";

export function Topbar({
  userEmail,
  userName,
  userId,
  organizationId,
  orgName,
  initialNotifications,
}: {
  userEmail: string | null;
  userName: string | null;
  userId: string;
  organizationId: string;
  orgName: string;
  initialNotifications: NotificationItem[];
}) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 sm:px-6 gap-3 shrink-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MobileNav orgName={orgName} />
        <CommandPalette />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/ai-assistant"
          aria-label="Open AI Assistant"
          className="h-8 w-8 flex items-center justify-center rounded-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
        >
          <Sparkles className="h-4 w-4" />
        </Link>

        <NotificationBell
          initialNotifications={initialNotifications}
          organizationId={organizationId}
          userId={userId}
        />

        <UserMenu userEmail={userEmail} userName={userName} />
      </div>
    </header>
  );
}
