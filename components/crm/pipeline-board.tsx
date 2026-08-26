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
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
      {DEAL_STAGES.map((stageDef) => {
        const stageDeals = localDeals.filter((d) => d.stage === stageDef.value);
        const stageValue = stageDeals.reduce((s, d) => s + Number(d.value ?? 0), 0);

        return (
          <div
            key={stageDef.value}
            className="flex-shrink-0 w-72"
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
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-sm font-medium text-white/80">
                {stageDef.label}
                <span className="ml-1.5 text-faint">{stageDeals.length}</span>
              </h3>
              <span className="text-xs text-muted">
                ${stageValue.toLocaleString()}
              </span>
            </div>

            <div
              className={cn(
                "rounded-md border border-t-2 bg-surface/40 min-h-[120px] p-2 space-y-2 transition-colors",
                stageAccent[stageDef.value],
                dragOverStage === stageDef.value
                  ? "border-border bg-accent/5"
                  : "border-border"
              )}
            >
              {stageDeals.map((deal) => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("dealId", deal.id);
                  }}
                  className="group rounded-sm border border-border bg-surface p-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white leading-snug">
                      {deal.title}
                    </p>
                    <button
                      onClick={() => handleDelete(deal.id)}
                      aria-label={`Delete deal ${deal.title}`}
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 shrink-0 h-5 w-5 flex items-center justify-center rounded text-faint hover:text-danger transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  {deal.crm_companies?.name && (
                    <p className="text-xs text-muted mt-1">{deal.crm_companies.name}</p>
                  )}
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-sm font-semibold text-white">
                      ${Number(deal.value ?? 0).toLocaleString()}
                    </span>
                    {deal.crm_contacts?.full_name && (
                      <span className="h-5 w-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[10px] font-medium text-accent">
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
                    className="mt-2.5 w-full h-8 px-2 rounded-sm bg-background border border-border text-xs text-white/80 hover:border-white/20 focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none transition-all"
                  >
                    {DEAL_STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {stageDeals.length === 0 && (
                <div className="h-20 flex items-center justify-center text-xs text-faint">
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
