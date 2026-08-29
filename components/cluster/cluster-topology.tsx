"use client";

import { useState, useEffect } from "react";
import {
  Server,
  Network,
  Cpu,
  Database,
  Zap,
  ShieldCheck,
  Activity,
  HardDrive,
  Globe,
  Radio,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface ClusterNode {
  id: string;
  name: string;
  role: string;
  category: "gateway" | "compute" | "database" | "ai" | "cache" | "edge";
  region: string;
  status: "healthy" | "busy" | "syncing";
  latency: number;
  cpu: number;
  memory: number;
  throughput: string;
  icon: typeof Server;
  description: string;
  ip: string;
  uptime: string;
  connections: string[];
}

export const CLUSTER_NODES: ClusterNode[] = [
  {
    id: "ingress-main",
    name: "Cluster Ingress & Load Balancer",
    role: "Traffic Orchestration",
    category: "gateway",
    region: "Frankfurt (eu-central-1)",
    status: "healthy",
    latency: 8,
    cpu: 38,
    memory: 46,
    throughput: "14.2k req/s",
    icon: Globe,
    description: "HTTP/3 & TLS termination gateway routing tenant traffic across multi-region micro-nodes.",
    ip: "10.0.1.4",
    uptime: "99.994%",
    connections: ["ws-engine", "db-rls-shard", "ai-vector", "edge-us"],
  },
  {
    id: "ws-engine",
    name: "Realtime WebSocket Node",
    role: "Sub-50ms Sync Engine",
    category: "compute",
    region: "Frankfurt (eu-central-1)",
    status: "healthy",
    latency: 11,
    cpu: 52,
    memory: 64,
    throughput: "4.8k msg/s",
    icon: Radio,
    description: "Low-latency state broadcaster synchronizing deals, Kanban tasks, and chat channels.",
    ip: "10.0.2.12",
    uptime: "99.998%",
    connections: ["ingress-main", "db-rls-shard"],
  },
  {
    id: "db-rls-shard",
    name: "Postgres Tenant RLS Shard-01",
    role: "Isolated Multi-Tenant Storage",
    category: "database",
    region: "Frankfurt (eu-central-1)",
    status: "healthy",
    latency: 14,
    cpu: 44,
    memory: 71,
    throughput: "2.9k qps",
    icon: Database,
    description: "Primary transactional cluster with row-level security isolation and automated replication.",
    ip: "10.0.3.8",
    uptime: "99.999%",
    connections: ["ingress-main", "cache-redis", "job-worker"],
  },
  {
    id: "ai-vector",
    name: "AI Vector & Embedding Worker",
    role: "Semantic Knowledge Engine",
    category: "ai",
    region: "Frankfurt (eu-central-1)",
    status: "healthy",
    latency: 21,
    cpu: 67,
    memory: 78,
    throughput: "860 ops/s",
    icon: Sparkles,
    description: "Accelerated vector search and retrieval-augmented generation worker for workspace intelligence.",
    ip: "10.0.4.15",
    uptime: "99.985%",
    connections: ["ingress-main", "db-rls-shard"],
  },
  {
    id: "cache-redis",
    name: "L1 In-Memory Cache Pool",
    role: "Sub-millisecond Session Layer",
    category: "cache",
    region: "Frankfurt (eu-central-1)",
    status: "healthy",
    latency: 2,
    cpu: 22,
    memory: 41,
    throughput: "38.5k ops/s",
    icon: Zap,
    description: "High-throughput in-memory caching for permissions, session tokens, and CRM lookups.",
    ip: "10.0.5.2",
    uptime: "100.0%",
    connections: ["db-rls-shard", "ingress-main"],
  },
  {
    id: "job-worker",
    name: "Background Queue & Event Dispatcher",
    role: "Async Pipeline Processing",
    category: "compute",
    region: "Frankfurt (eu-central-1)",
    status: "healthy",
    latency: 16,
    cpu: 31,
    memory: 38,
    throughput: "1.2k jobs/m",
    icon: Layers,
    description: "Transactional background job processor handling email dispatches, webhooks, and audit logs.",
    ip: "10.0.6.9",
    uptime: "99.992%",
    connections: ["db-rls-shard"],
  },
  {
    id: "edge-us",
    name: "Edge CDN & PoP (US-East)",
    role: "Global Acceleration Node",
    category: "edge",
    region: "N. Virginia (us-east-1)",
    status: "healthy",
    latency: 18,
    cpu: 29,
    memory: 35,
    throughput: "7.1k req/s",
    icon: Network,
    description: "Distributed edge proxy accelerating static assets and API requests for Americas traffic.",
    ip: "10.0.7.3",
    uptime: "99.997%",
    connections: ["ingress-main"],
  },
];

export function ClusterTopology({
  compact = false,
  orgName = "Merkato",
}: {
  compact?: boolean;
  orgName?: string;
}) {
  const [selectedNode, setSelectedNode] = useState<ClusterNode>(CLUSTER_NODES[0]);
  const [nodes, setNodes] = useState<ClusterNode[]>(CLUSTER_NODES);
  const [lastPing, setLastPing] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Subtle telemetry heartbeat animation
  useEffect(() => {
    const timer = setInterval(() => {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          latency: Math.max(1, n.latency + Math.floor(Math.random() * 5) - 2),
          cpu: Math.min(95, Math.max(15, n.cpu + Math.floor(Math.random() * 7) - 3)),
        }))
      );
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  function triggerPing() {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastPing(Date.now());
      setIsRefreshing(false);
    }, 300);
  }

  const filteredNodes = nodes.filter(
    (n) => filterCategory === "all" || n.category === filterCategory
  );

  return (
    <div className="space-y-6">
      {/* Cluster Overview Header Strip */}
      <div className="p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-surface/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_12px_var(--primary-glow)]">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {orgName} High-Velocity Nodes Cluster
              </h2>
              <Badge variant="success" dot>
                All 7 Nodes Healthy
              </Badge>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Multi-Region Micro-Topology · Sub-50ms Realtime Mesh · Postgres RLS Tenant Isolated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg border border-white/[0.06] bg-black/30">
            <span className="text-white/40 text-[10px] block uppercase">P99 Mesh Latency</span>
            <span className="text-emerald-400 font-bold">11.4 ms</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-white/[0.06] bg-black/30">
            <span className="text-white/40 text-[10px] block uppercase">Aggregate Flow</span>
            <span className="text-primary font-bold">38.2k req/s</span>
          </div>
          <button
            type="button"
            onClick={triggerPing}
            aria-label="Refresh node telemetry"
            className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-all duration-150 active:scale-95"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-primary")} />
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.06] pb-3">
          {["all", "gateway", "compute", "database", "ai", "cache", "edge"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all duration-150",
                filterCategory === cat
                  ? "bg-primary text-white shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              {cat === "all" ? "All Cluster Nodes" : cat}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid: Interactive Nodes Visualizer + Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Nodes Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredNodes.map((node) => {
            const Icon = node.icon;
            const isSelected = selectedNode.id === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNode(node)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group active:scale-[0.985] flex flex-col justify-between h-full",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-[0_0_20px_var(--primary-glow)] ring-1 ring-primary/40"
                    : "border-white/[0.08] bg-surface/40 hover:bg-white/[0.04] hover:border-white/15"
                )}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 transition-colors",
                          isSelected
                            ? "bg-primary text-white border-primary/30"
                            : "bg-white/[0.06] border-white/10 text-white/70 group-hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                          {node.name}
                        </h3>
                        <p className="text-[10px] text-white/50 font-mono truncate">{node.role}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {node.latency}ms
                    </span>
                  </div>

                  <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed mb-3">
                    {node.description}
                  </p>
                </div>

                {/* Micro-telemetry bar */}
                <div className="pt-2.5 border-t border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                    <span>CPU: {node.cpu}%</span>
                    <span>MEM: {node.memory}%</span>
                    <span className="text-primary font-semibold">{node.throughput}</span>
                  </div>
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
                      style={{ width: `${node.cpu}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 1 Col: Live Selected Node Telemetry Inspector */}
        <div className="rounded-2xl border border-white/[0.08] bg-surface/60 backdrop-blur-md p-5 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Node Inspector
                </h3>
              </div>
              <span className="text-[10px] font-mono text-white/40">ID: {selectedNode.id}</span>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">{selectedNode.name}</h4>
                <p className="text-xs text-white/50 font-mono mt-0.5">{selectedNode.role}</p>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                <div className="p-2.5 rounded-xl border border-white/[0.06] bg-black/30">
                  <span className="text-[10px] text-white/40 block">REGION</span>
                  <span className="text-white font-medium text-[11px] truncate block">
                    {selectedNode.region}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-white/[0.06] bg-black/30">
                  <span className="text-[10px] text-white/40 block">INTERNAL IP</span>
                  <span className="text-white font-medium text-[11px]">{selectedNode.ip}</span>
                </div>
                <div className="p-2.5 rounded-xl border border-white/[0.06] bg-black/30">
                  <span className="text-[10px] text-white/40 block">UPTIME</span>
                  <span className="text-emerald-400 font-medium text-[11px]">
                    {selectedNode.uptime}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-white/[0.06] bg-black/30">
                  <span className="text-[10px] text-white/40 block">FLOW RATE</span>
                  <span className="text-primary font-medium text-[11px]">
                    {selectedNode.throughput}
                  </span>
                </div>
              </div>

              {/* Topology Mesh Links */}
              <div>
                <p className="text-[11px] font-semibold text-white/60 mb-2">Connected Mesh Edges:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.connections.map((targetId) => {
                    const target = nodes.find((n) => n.id === targetId);
                    return (
                      <span
                        key={targetId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] font-mono text-white/70"
                      >
                        <Zap className="h-2.5 w-2.5 text-primary" />
                        {target?.name.split(" ")[0] ?? targetId}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Security & RLS Compliance status */}
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-emerald-400">Tenancy Isolation Active</p>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    Node requests are cryptographically scoped to organization tenancy context.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-white/40">
            <span>Mesh Heartbeat: Active</span>
            <span className="text-emerald-400">Ping: {selectedNode.latency}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
