import { requireOrgContext } from "@/lib/org-context";
import { ClusterTopology } from "@/components/cluster/cluster-topology";

export default async function ClusterPage() {
  const ctx = await requireOrgContext();

  return (
    <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Nodes Cluster &amp; Telemetry
        </h1>
        <p className="text-sm text-white/60 mt-1">
          Real-time topology, multi-region routing nodes, and row-level tenancy isolation mesh for {ctx.organization.name}.
        </p>
      </div>

      <ClusterTopology orgName={ctx.organization.name} />
    </div>
  );
}
