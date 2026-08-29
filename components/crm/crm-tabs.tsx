"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/crm/deals", label: "Deal Pipeline", icon: Briefcase },
  { href: "/crm/contacts", label: "Contacts Directory", icon: Users },
  { href: "/crm/companies", label: "Companies & Accounts", icon: Building2 },
];

export function CrmTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 sm:px-8 bg-surface/30 backdrop-blur-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 -mb-px transition-all duration-150",
              active
                ? "border-primary text-primary shadow-[0_2px_0_0_var(--primary-glow)]"
                : "border-transparent text-white/50 hover:text-white hover:border-white/20"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
