"use client";

import { useState } from "react";
import {
  Briefcase,
  KanbanSquare,
  Users,
  LifeBuoy,
  Send,
  Coffee,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PreviewTab = "crm" | "sprints" | "team" | "support";

export function InteractivePreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>("crm");

  const tabs: { id: PreviewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "crm", label: "CRM Pipeline", icon: Briefcase },
    { id: "sprints", label: "Sprint Tasks", icon: KanbanSquare },
    { id: "team", label: "Team Channels", icon: Users },
    { id: "support", label: "Support Tickets", icon: LifeBuoy },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-white/[0.1] bg-surface/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden text-left transition-all">
      {/* Top Window Bar & Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          <span className="text-[11px] font-mono text-white/40 ml-2 hidden sm:inline">
            workspace.merkato.app
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95",
                  active
                    ? "bg-primary text-white shadow-[0_0_12px_var(--primary-glow)]"
                    : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Screen Content Viewport */}
      <div className="p-5 min-h-[320px] flex flex-col justify-center bg-background/50">
        {/* 1. CRM Pipeline Mockup */}
        {activeTab === "crm" && (
          <div className="space-y-3.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Deal Pipeline</span>
                <span className="text-white/40 font-mono">· $184,500 active</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                +24% velocity
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.08] bg-surface p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white/80">Qualified</span>
                  <span className="text-white/40 font-mono">$45,000</span>
                </div>
                <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <p className="text-xs text-white font-medium">Stripe Marketplace</p>
                  <p className="text-[11px] text-white/45 font-mono mt-0.5">$25,000</p>
                </div>
                <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <p className="text-xs text-white font-medium">Nordic Retail</p>
                  <p className="text-[11px] text-white/45 font-mono mt-0.5">$20,000</p>
                </div>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-primary">In Proposal</span>
                  <span className="text-primary font-mono font-semibold">$82,000</span>
                </div>
                <div className="p-2.5 rounded-lg border border-primary/25 bg-surface shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white font-medium">Acme Global Cloud</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">Hot</span>
                  </div>
                  <p className="text-[11px] text-white/45 font-mono mt-0.5">$54,000</p>
                </div>
                <div className="p-2.5 rounded-lg border border-white/[0.06] bg-surface">
                  <p className="text-xs text-white font-medium">Apex Media</p>
                  <p className="text-[11px] text-white/45 font-mono mt-0.5">$28,000</p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.03] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">Closed &amp; Won</span>
                  <span className="text-emerald-400 font-mono font-semibold">$57,500</span>
                </div>
                <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06]">
                  <p className="text-xs text-white font-medium">Addis Tech</p>
                  <p className="text-[11px] text-emerald-400 font-mono mt-0.5">✓ Signed ($35,000)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Sprint Tasks Mockup */}
        {activeTab === "sprints" && (
          <div className="space-y-3.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Sprint 14</span>
                <span className="text-white/40 font-mono">· 12 of 15 tasks completed</span>
              </div>
              <div className="w-28 sm:w-36 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-emerald-400 w-4/5 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-white/[0.08] bg-surface p-3.5 space-y-2">
                <span className="text-xs text-white/60 font-bold">To Do (2)</span>
                <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <p className="text-xs text-white font-medium">Webhook retry queue</p>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/50">Low</span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.03] p-3.5 space-y-2">
                <span className="text-xs text-amber-300 font-bold">In Progress (1)</span>
                <div className="p-2.5 rounded-lg border border-amber-500/20 bg-surface shadow-sm">
                  <p className="text-xs text-white font-medium">Multi-region replication</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">Urgent</span>
                    <span className="text-[10px] font-mono text-white/50">Assignee: Hana</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.03] p-3.5 space-y-2">
                <span className="text-xs text-emerald-400 font-bold">Done (12)</span>
                <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06]">
                  <p className="text-xs text-white font-medium">RLS policy check</p>
                  <span className="text-[10px] font-mono text-emerald-400">✓ Merged to main</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Team Channels Mockup */}
        {activeTab === "team" && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fade-in">
            <div className="sm:col-span-1 rounded-xl border border-white/[0.08] bg-surface p-3 space-y-2.5">
              <span className="text-[10px] uppercase font-mono text-white/40 font-bold">Channels</span>
              <div className="space-y-1 text-xs">
                <div className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary font-bold"># engineering</div>
                <div className="px-2.5 py-1 rounded-lg text-white/60 hover:text-white"># sales</div>
                <div className="px-2.5 py-1 rounded-lg text-white/60 hover:text-white"># general</div>
              </div>
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] uppercase font-mono text-white/40 font-bold">Status</span>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-300">
                  <Coffee className="h-3 w-3 text-amber-400" />
                  <span>Bedru (Tea Break)</span>
                </div>
              </div>
            </div>

            <div className="sm:col-span-3 rounded-xl border border-white/[0.08] bg-surface p-3.5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">H</div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-white">Hana</span>
                      <span className="text-[10px] font-mono text-white/40">10:42 AM</span>
                    </div>
                    <p className="text-xs text-white/85 mt-0.5">Database migration complete with zero downtime! 🚀</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">B</div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-white">Bedru</span>
                      <span className="text-[10px] font-mono text-white/40">10:44 AM</span>
                    </div>
                    <p className="text-xs text-white/85 mt-0.5">All 7 cluster nodes are healthy and responding in sub-12ms.</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center gap-2">
                <div className="flex-1 h-8 px-3 rounded-lg bg-black/40 border border-white/10 text-xs text-white/40 flex items-center">
                  Message #engineering...
                </div>
                <button className="h-8 px-3 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm">
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Support Tickets Mockup */}
        {activeTab === "support" && (
          <div className="space-y-3.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
              <span className="font-bold text-white">Customer Support Portal Queue</span>
              <span className="text-emerald-400 font-mono text-[11px]">98.5% SLA resolution</span>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-surface divide-y divide-white/[0.06] overflow-hidden">
              <div className="p-3.5 flex items-center justify-between text-xs hover:bg-white/[0.02]">
                <div>
                  <p className="font-bold text-white">Single Sign-On (SAML) setup</p>
                  <p className="text-[11px] text-white/45 font-mono mt-0.5">Client: Acme Corp · Assigned to Support Lead</p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  Pending Review
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between text-xs hover:bg-white/[0.02]">
                <div>
                  <p className="font-bold text-white">Export CRM deals to CSV</p>
                  <p className="text-[11px] text-white/45 font-mono mt-0.5">Client: Horizon Labs · Assigned to Bedru</p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  Resolved
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
