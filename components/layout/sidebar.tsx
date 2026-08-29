"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Contact2,
  KanbanSquare,
  Users,
  BookOpen,
  LifeBuoy,
  Sparkles,
  Settings,
  FolderOpen,
  BarChart3,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MerkatoMark } from "@/components/ui/brand-logo";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: Contact2 },
  { href: "/projects", label: "Projects", icon: KanbanSquare },
  { href: "/team", label: "Team", icon: Users },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/cluster", label: "Nodes Cluster", icon: Network },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles },
];

interface NavSection {
  title: string | null;
  items: typeof navItems;
}

const navSections: NavSection[] = [
  { title: null, items: [navItems[0]] },
  { title: "Workspace", items: navItems.slice(1, 7) },
  { title: "Insights", items: navItems.slice(7) },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navSections.map((section, si) => (
        <div key={section.title ?? "main"} className={si > 0 ? "pt-5" : ""}>
          {section.title && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-faint select-none">
              {section.title}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                    active
                      ? "bg-primary/10 text-white shadow-sm"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary"
                    />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-primary" : "text-white/50 group-hover:text-white/80"
                    )}
                    strokeWidth={2}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return <MerkatoMark size={size} />;
}

export function Sidebar({ orgName }: { orgName: string }) {
  const pathname = usePathname();
  const settingsActive = pathname.startsWith("/settings");

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-white/[0.08] bg-surface shrink-0">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-white/[0.08]">
        <MerkatoMark size="sm" />
        <span className="text-sm font-bold text-white truncate">{orgName}</span>
      </div>

      <nav aria-label="Main" className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
        <NavLinks />
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <Link
          href="/settings"
          aria-current={settingsActive ? "page" : undefined}
          className={cn(
            "relative flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
            settingsActive
              ? "bg-primary/10 text-white"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          )}
        >
          {settingsActive && (
            <span
              aria-hidden="true"
              className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary"
            />
          )}
          <Settings
            className={cn("h-4 w-4", settingsActive ? "text-primary" : "text-white/50")}
            strokeWidth={2}
          />
          Settings
        </Link>
      </div>
    </aside>
  );
}
