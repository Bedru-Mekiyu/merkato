"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEAL_STAGES, type Deal, type DealStage } from "@/types/database";
import { updateDealStage, deleteDeal } from "@/app/(app)/crm/actions";
import { useToast } from "@/components/ui/toast";

const stageAccent: Record<DealStage, string> = {
  new_lead: "border-t-white/20",
  contacted: "border-t-accent/40",
  qualified: "border-t-accent",
  proposal: "border-t-warning",
  won: "border-t-success",
  lost: "border-t-danger",
};

export function PipelineBoard({ deals }: { deals: Deal[] }) {
  const router = useRouter();
  const { report } = useToast();
  const [, startTransition] = useTransition();
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [localDeals, setLocalDeals] = useState(deals);

  // Keep local state in sync whenever fresh server data arrives
  // (e.g. after router.refresh() following a mutation).
  useEffect(() => {
    setLocalDeals(deals);
  }, [deals]);

  function moveDeal(dealId: string, stage: DealStage) {
    const previous = localDeals;
    setLocalDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage } : d))
    );
    startTransition(async () => {
      const result = await updateDealStage(dealId, stage);
      if (!report(result)) {
        setLocalDeals(previous);
        return;
      }
      router.refresh();
    });
  }

  function handleDrop(stage: DealStage, dealId: string) {
    setDragOverStage(null);
    moveDeal(dealId, stage);
  }

  async function handleDelete(id: string) {
    const deal = localDeals.find((d) => d.id === id);
    if (
      !window.confirm(
        `Delete "${deal?.title ?? "this deal"}"? This cannot be undone.`
      )
    ) {
      return;
    }

    const previous = localDeals;
    setLocalDeals((prev) => prev.filter((d) => d.id !== id));
    const result = await deleteDeal(id);
    if (!report(result, "Deal deleted")) {
      setLocalDeals(previous);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none -mx-4 px-4 sm:mx-0 sm:px-0">
      {DEAL_STAGES.map((stageDef) => {
        const stageDeals = localDeals.filter((d) => d.stage === stageDef.value);
        const stageValue = stageDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);

        return (
          <div
            key={stageDef.value}
            className="flex-shrink-0 w-72 sm:w-80 snap-center"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stageDef.value);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => {
              e.preventDefault();
              const dealId = e.dataTransfer.getData("dealId");
              if (dealId) handleDrop(stageDef.value, dealId);
            }}
          >
            <div className="flex items-center justify-between px-1 mb-2.5">
              <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{stageDef.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/60">
                  {stageDeals.length}
                </span>
              </h3>
              <span className="text-xs font-mono font-semibold text-white/50">
                ${stageValue.toLocaleString()}
              </span>
            </div>

            <div
              className={cn(
                "rounded-xl border border-t-2 bg-surface/30 min-h-[140px] p-2 space-y-2 transition-colors",
                stageAccent[stageDef.value],
                dragOverStage === stageDef.value
                  ? "border-primary/40 bg-primary/5"
                  : "border-white/[0.06]"
              )}
            >
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("dealId", deal.id);
                  }}
                  className="group rounded-xl border border-white/[0.08] bg-surface/85 backdrop-blur-sm p-3.5 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-white leading-snug">
                      {deal.title}
                    </p>
                    <button
                      onClick={() => handleDelete(deal.id)}
                      aria-label={`Delete deal ${deal.title}`}
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 shrink-0 h-5 w-5 flex items-center justify-center rounded-md text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  {deal.crm_companies?.name && (
                    <p className="text-[11px] text-white/50 mt-0.5">{deal.crm_companies.name}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-bold text-white font-mono">
                      ${Number(deal.value ?? 0).toLocaleString()}
                    </span>
                    {deal.crm_contacts?.full_name && (
                      <span className="h-5 w-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
                        {deal.crm_contacts.full_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Keyboard/touch accessible alternative to drag-and-drop */}
                  <label className="sr-only" htmlFor={`stage-${deal.id}`}>
                    Move {deal.title} to another stage
                  </label>
                  <select
                    id={`stage-${deal.id}`}
                    value={deal.stage}
                    onChange={(e) => moveDeal(deal.id, e.target.value as DealStage)}
                    className="mt-2.5 w-full h-7 px-2 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-white/80 hover:border-white/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s.value} value={s.value} className="bg-surface text-white">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {stageDeals.length === 0 && (
                <div className="h-24 flex items-center justify-center text-xs text-white/30 font-mono">
                  No deals in this stage
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
