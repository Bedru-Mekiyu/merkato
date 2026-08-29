"use client";

import Link from "next/link";
import { Network, Server, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { CLUSTER_NODES } from "@/components/cluster/cluster-topology";

export function DashboardClusterWidget() {
  return (
    <div className="mt-8 rounded-2xl border border-white/[0.08] bg-surface/50 backdrop-blur-md p-5 sm:p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.06] mb-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_12px_var(--primary-glow)]">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Nodes Cluster Health</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                7 / 7 Online
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Multi-Region Mesh · Sub-50ms Realtime State · Postgres RLS Isolation
            </p>
          </div>
        </div>

        <Link
          href="/cluster"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover hover:underline transition-colors"
        >
          <span>Open Topology Inspector</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {CLUSTER_NODES.map((node) => {
          const Icon = node.icon;
          return (
            <Link
              key={node.id}
              href="/cluster"
              className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 transition-all duration-150 group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <Icon className="h-3 w-3" />
                </div>
                <span className="text-[10px] font-mono text-emerald-400">{node.latency}ms</span>
              </div>
              <p className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
                {node.name.split(" ")[0]}
              </p>
              <p className="text-[10px] text-white/40 font-mono truncate mt-0.5">{node.role}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.04] flex flex-wrap items-center justify-between text-[11px] text-white/40 font-mono">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          100% Cryptographic Tenant Scoping
        </span>
        <span className="flex items-center gap-1.5 text-primary">
          <Zap className="h-3 w-3" />
          Aggregate Flow: 38.2k req/s
        </span>
      </div>
    </div>
  );
}
