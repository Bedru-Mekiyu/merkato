"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/team", label: "Channels" },
  { href: "/team/directory", label: "Directory" },
  { href: "/team/activity", label: "Activity" },
];

export function TeamTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-border px-6 sm:px-8">
      {tabs.map((tab) => {
        const active =
          tab.href === "/team"
            ? pathname === "/team" || pathname.startsWith("/team/channels") || pathname.startsWith("/team/dm")
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              active
                ? "border-accent text-white"
                : "border-transparent text-muted hover:text-white/90"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
