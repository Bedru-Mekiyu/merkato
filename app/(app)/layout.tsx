import { requireStaffContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { PageTransition } from "@/components/layout/page-transition";
import type { NotificationItem } from "@/components/layout/notification-bell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireStaffContext();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, is_read, created_at")
    .eq("recipient_id", ctx.userId)
    .eq("organization_id", ctx.organization.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <Sidebar orgName={ctx.organization.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userEmail={ctx.email}
          userName={ctx.profile?.full_name ?? null}
          userId={ctx.userId}
          organizationId={ctx.organization.id}
          orgName={ctx.organization.name}
          initialNotifications={(notifications ?? []) as NotificationItem[]}
        />
        <main className="flex-1 overflow-y-auto">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
