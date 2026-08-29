import Link from "next/link";
import {
  Briefcase,
  KanbanSquare,
  Users,
  LifeBuoy,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MerkatoLogo } from "@/components/ui/brand-logo";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { InteractivePreview } from "@/components/landing/interactive-preview";

const modules = [
  {
    icon: Briefcase,
    title: "1. CRM & Deals",
    desc: "Sales pipelines, deal forecasting, contact activity timelines, and revenue rollups.",
    tone: "bg-primary/10 text-primary border-primary/20",
  },
  {
    icon: KanbanSquare,
    title: "2. Sprint Tasks",
    desc: "Kanban sprint boards, priority triage, subtask checklists, and engineering progress.",
    tone: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  {
    icon: Users,
    title: "3. Team Channels",
    desc: "Real-time topic channels, 1-on-1 direct messages, and live presence with Tea Break status.",
    tone: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    icon: LifeBuoy,
    title: "4. Customer Support",
    desc: "Dedicated public client ticketing portal with isolated database access and SLA queues.",
    tone: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30 relative overflow-hidden">
      {/* Subtle Ambient Theme Aurora */}
      <div className="aurora opacity-25 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-surface/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="group flex items-center">
            <MerkatoLogo size="md" />
          </Link>

          <div className="flex items-center gap-3">
            <ThemeSelector />

            {user ? (
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-[0_0_12px_var(--primary-glow)] transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-[0_0_12px_var(--primary-glow)] transition-all"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-16 pb-10 px-4 sm:px-6 max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-medium mb-4 shadow-[0_0_12px_var(--primary-glow)] animate-fade-in-up">
          <Sparkles className="h-3 w-3" />
          <span>Unified Startup Workspace</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 animate-fade-in-up leading-tight">
          Consolidate your startup in{" "}
          <span className="bg-gradient-to-r from-primary via-primary-hover to-secondary bg-clip-text text-transparent">
            one unified workspace.
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-white/60 max-w-lg mx-auto leading-relaxed mb-8 animate-fade-in-up">
          Merkato replaces disconnected SaaS tools by bringing your CRM deals, sprint tasks, team channels, and customer support into a single database-isolated platform.
        </p>

        {/* Interactive Workspace Preview */}
        <div className="animate-fade-in-up">
          <InteractivePreview />
        </div>
      </section>

      {/* 4 Core Modules */}
      <section className="py-14 px-4 sm:px-6 max-w-4xl mx-auto border-t border-white/[0.06] relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Four essential modules in one system
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Built on a single real-time database to eliminate context switching and separate logins.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="group rounded-xl border border-white/[0.08] bg-surface/85 backdrop-blur-md p-4 text-left hover:border-white/20 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${m.tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-white group-hover:text-primary transition-colors">{m.title}</h3>
                </div>
                <p className="text-xs text-white/55 leading-relaxed">
                  {m.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Security Note */}
      <section className="py-10 px-4 sm:px-6 max-w-4xl mx-auto border-t border-white/[0.06] relative z-10">
        <div className="rounded-xl border border-white/[0.08] bg-surface/80 backdrop-blur-md p-5 text-left flex items-start gap-3 shadow-sm">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5 shadow-[0_0_10px_var(--primary-glow)]">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Postgres Row-Level Security</h4>
            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
              Every organization runs in strict tenant isolation with verified RBAC roles and sub-50ms sync.
            </p>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-white/[0.06] bg-surface/60 py-6 px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <MerkatoLogo size="sm" />

          <div className="flex items-center gap-3">
            <ThemeSelector />
            <Link
              href="/login"
              className="text-xs text-white/70 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/15 transition-colors border border-white/10"
            >
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
