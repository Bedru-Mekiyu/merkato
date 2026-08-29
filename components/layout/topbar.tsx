import Link from "next/link";
import { Sparkles } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell, type NotificationItem } from "@/components/layout/notification-bell";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { ThemeSelector } from "@/components/theme/theme-selector";

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
    <header className="h-14 border-b border-border flex items-center justify-between px-3 sm:px-6 gap-2 sm:gap-3 shrink-0 bg-surface/40 backdrop-blur-md">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MobileNav orgName={orgName} />
        <CommandPalette />
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <ThemeSelector />

        <Link
          href="/ai-assistant"
          aria-label="Open AI Assistant"
          className="h-8 w-8 flex items-center justify-center rounded-md border border-white/10 text-white/75 hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <Sparkles className="h-4 w-4 text-primary" />
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
