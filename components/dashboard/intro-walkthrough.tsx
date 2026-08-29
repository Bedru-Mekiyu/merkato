"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Palette,
  Briefcase,
  KanbanSquare,
  ChevronRight,
  X,
  Zap,
  CheckCircle2,
  Network,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

const INTRO_STORAGE_KEY = "merkato_intro_dismissed";

export function IntroWalkthrough({ orgName }: { orgName: string }) {
  const { theme, setTheme, themes, clickTime } = useTheme();
  const [dismissed, setDismissed] = useState(true);
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem(INTRO_STORAGE_KEY) === "true";
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, "true");
    } catch {
      // Ignore
    }
  }

  function handleReset() {
    setDismissed(false);
    try {
      localStorage.removeItem(INTRO_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  if (dismissed) {
    return (
      <div className="mb-6 flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/[0.08] bg-surface/60 backdrop-blur text-xs">
        <div className="flex items-center gap-2 text-white/70">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Quick Intro Guide &amp; Theme Studio available</span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Re-open Tour
        </button>
      </div>
    );
  }

  const steps = [
    {
      id: "theme",
      title: "1. Choose Your Theme",
      subtitle: "Switch between Moodle Cobalt, Cyber Aurora, Emerald Matrix, Sunset, and Frost.",
      icon: Palette,
    },
    {
      id: "crm",
      title: "2. Track Deal Pipeline",
      subtitle: "Manage contacts, accounts, and 6-stage drag-and-drop revenue tracking.",
      icon: Briefcase,
      href: "/crm/deals",
    },
    {
      id: "projects",
      title: "3. Sprint Execution",
      subtitle: "Organize engineering, design, and operations with Kanban and List views.",
      icon: KanbanSquare,
      href: "/projects",
    },
    {
      id: "cluster",
      title: "4. Nodes Cluster",
      subtitle: "Inspect real-time telemetry, 7 distributed nodes, and sub-50ms mesh.",
      icon: Network,
      href: "/cluster",
    },
    {
      id: "ai",
      title: "5. AI Assistant",
      subtitle: "Ask questions with full context of your deals, tasks, and documentation.",
      icon: Sparkles,
      href: "/ai-assistant",
    },
  ];

  return (
    <div className="relative mb-8 rounded-2xl border border-white/10 bg-gradient-to-b from-surface to-surface/80 p-5 sm:p-6 shadow-xl backdrop-blur overflow-hidden animate-fade-in-up">
      <div className="absolute top-0 right-0 p-4">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss quick-start guide"
          className="h-7 w-7 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 border border-primary/25 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
          <Sparkles className="h-3 w-3" />
          Workspace Intro &amp; Setup
        </span>
        {clickTime !== null && (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
            <Zap className="h-3 w-3" />
            Click Latency: {clickTime}ms
          </span>
        )}
      </div>

      <div className="max-w-2xl mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Welcome to {orgName}
        </h2>
        <p className="text-sm text-white/60 mt-1 leading-relaxed">
          Your workspace unites CRM, sprint tracking, real-time collaboration, and customer support. Customize your visual theme below or dive straight into execution.
        </p>
      </div>

      {/* Theme Quick-Picker */}
      <div className="mb-6 p-4 rounded-xl border border-white/[0.08] bg-black/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-white/90 uppercase tracking-wider">
            Select Visual Theme:
          </p>
          <span className="text-xs text-primary font-medium">
            {themes.find((t) => t.id === theme)?.name} Active
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {themes.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all duration-150 active:scale-[0.98]",
                  active
                    ? "border-primary bg-primary/15 shadow-sm"
                    : "border-white/10 bg-surface/60 hover:bg-white/[0.06] hover:border-white/20"
                )}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: t.primaryColor }}
                />
                <span className="text-xs font-medium text-white truncate">{t.name}</span>
                {active && <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const content = (
            <div
              className={cn(
                "p-3.5 rounded-xl border transition-all duration-150 h-full flex flex-col justify-between group",
                activeStep === idx
                  ? "border-primary/40 bg-primary/5"
                  : "border-white/[0.08] bg-surface/40 hover:bg-white/[0.04] hover:border-white/15"
              )}
              onClick={() => setActiveStep(idx)}
            >
              <div>
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-2.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-xs font-semibold text-white">{step.title}</h3>
                <p className="text-[11px] text-white/50 mt-1 leading-normal">{step.subtitle}</p>
              </div>
              {step.href && (
                <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                  <span>Open</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              )}
            </div>
          );

          if (step.href) {
            return (
              <Link key={step.id} href={step.href}>
                {content}
              </Link>
            );
          }

          return <div key={step.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}
