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
  FolderOpen,
  BookOpen,
  BarChart3,
  Activity,
  Zap,
  Layers,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MerkatoLogo } from "@/components/ui/brand-logo";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { InteractivePreview } from "@/components/landing/interactive-preview";
import { LandingQA } from "@/components/landing/landing-qa";

const featurePillars = [
  {
    icon: Briefcase,
    title: "1. CRM & Sales Pipeline",
    desc: "6-stage visual drag-and-drop deal pipeline with company directories, contact timelines, and real-time revenue rollups.",
    tone: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    icon: KanbanSquare,
    title: "2. Sprint & Agile Boards",
    desc: "High-velocity Kanban task boards, milestone tracking, priority levels, subtask checklists, and task comments.",
    tone: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  {
    icon: Users,
    title: "3. Real-Time Team Channels",
    desc: "Instant WebSocket chat channels, 1-on-1 direct messages, and live presence indicator tags (including Tea Break status).",
    tone: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    icon: LifeBuoy,
    title: "4. Customer Support Helpdesk",
    desc: "Dual-surfaced ticketing: internal staff queue alongside a public customer portal at `/portal/[orgSlug]` with RLS-isolated notes.",
    tone: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
  {
    icon: FolderOpen,
    title: "5. Secure Document Drive",
    desc: "Hierarchical folders, drag-and-drop file uploads backed by Supabase Storage, version archiving, and signed download URLs.",
    tone: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  {
    icon: BookOpen,
    title: "6. Knowledge Base & Docs",
    desc: "XSS-safe Markdown editor, category organization, tag indexing, and draft-to-published editorial workflows.",
    tone: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  },
  {
    icon: BarChart3,
    title: "7. Zero-Dependency Analytics",
    desc: "Hand-rolled SVG line, bar, and donut charts visualizing pipeline velocity, sprint burndown, and ticket resolution.",
    tone: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
  {
    icon: Activity,
    title: "8. Live System Telemetry & AI",
    desc: "Live database latency diagnostics, Supabase Auth/Storage probes, and live RAG workspace intelligence synthesis.",
    tone: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  },
];

const comparisons = [
  {
    feature: "One login across CRM, Sprints, Chat & Support",
    merkato: true,
    traditional: false,
  },
  {
    feature: "Database-enforced Row-Level Security (Postgres RLS)",
    merkato: true,
    traditional: false,
  },
  {
    feature: "Dedicated public customer portal (`/portal/[orgSlug]`)",
    merkato: true,
    traditional: "Extra $60/mo",
  },
  {
    feature: "Real-time WebSocket sync across all 8 modules",
    merkato: true,
    traditional: false,
  },
  {
    feature: "Live Workspace Intelligence RAG Assistant",
    merkato: true,
    traditional: "Add-on $30/seat",
  },
  {
    feature: "Multi-theme high-contrast color engine",
    merkato: true,
    traditional: false,
  },
  {
    feature: "Monthly cost for a 10-person team",
    merkato: "$0 (Self-hosted)",
    traditional: "$450 – $1,200/mo",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30 relative overflow-hidden">
      {/* Subtle Ambient Theme Aurora & Background Glow */}
      <div className="aurora opacity-25 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-surface/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
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
                Go to Workspace →
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
                  Get Started Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-18 pb-12 px-4 sm:px-6 max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-medium mb-4 shadow-[0_0_12px_var(--primary-glow)] animate-fade-in-up">
          <Sparkles className="h-3 w-3" />
          <span>The 2026 Startup Operations OS</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 animate-fade-in-up leading-tight sm:leading-tight">
          Consolidate your entire startup into{" "}
          <span className="bg-gradient-to-r from-primary via-secondary to-primary-hover bg-clip-text text-transparent">
            one unified platform.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto leading-relaxed mb-8 animate-fade-in-up">
          Merkato replaces disconnected SaaS sprawl — CRM deals, sprint boards, team channels, customer support, and document drives — with **one codebase, one Postgres database, and one login**.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover shadow-[0_0_20px_var(--primary-glow)] transition-all flex items-center gap-2 active:scale-95"
          >
            <span>Launch Your Workspace Free</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="px-5 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white font-medium text-sm hover:bg-white/[0.08] transition-all"
          >
            Sign in to Existing Workspace
          </Link>
        </div>

        {/* Interactive Workspace Preview */}
        <div className="animate-fade-in-up">
          <InteractivePreview />
        </div>
      </section>

      {/* 8 Core Feature Pillars (Bento Grid) */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/[0.06] relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Eight essential pillars, zero context switching
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1.5 max-w-lg mx-auto">
            Everything your team needs to sell, ship, support, and collaborate built upon a single relational database.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featurePillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="group rounded-2xl border border-white/[0.08] bg-surface/70 backdrop-blur-md p-5 text-left hover:border-primary/40 hover:bg-surface transition-all duration-200 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 ${pillar.tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Platform Q&A Assistant */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto border-t border-white/[0.06] relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-2.5">
            <Sparkles className="h-3 w-3" />
            <span>Interactive Platform Assistant</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Have questions about how Merkato works?
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-md mx-auto">
            Ask our live Q&amp;A engine anything about architecture, features, security, or setup.
          </p>
        </div>

        <LandingQA />
      </section>

      {/* Comparison: Merkato vs. Fragmented SaaS */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto border-t border-white/[0.06] relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Why high-velocity teams choose Merkato
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-md mx-auto">
            Stop paying per-seat SaaS taxes across 5 separate logins and disconnected silos.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-surface/70 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="grid grid-cols-3 p-4 text-xs font-bold text-white border-b border-white/[0.08] bg-white/[0.02]">
            <span>Capabilities</span>
            <span className="text-primary text-center">Merkato Platform</span>
            <span className="text-white/40 text-center">Fragmented Stack</span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {comparisons.map((row, idx) => (
              <div key={idx} className="grid grid-cols-3 p-4 text-xs items-center">
                <span className="text-white/80 font-medium">{row.feature}</span>
                <div className="text-center flex justify-center">
                  {typeof row.merkato === "boolean" ? (
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-400 font-mono">{row.merkato}</span>
                  )}
                </div>
                <div className="text-center flex justify-center">
                  {typeof row.traditional === "boolean" ? (
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <X className="h-3 w-3" />
                    </span>
                  ) : (
                    <span className="text-white/40 font-mono">{row.traditional}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & RLS Banner */}
      <section className="py-10 px-4 sm:px-6 max-w-4xl mx-auto border-t border-white/[0.06] relative z-10">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md p-6 text-left flex items-start gap-4 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Database-Enforced Row-Level Security</h4>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">
              Every organization runs in strict tenant isolation. RBAC roles (`owner`, `admin`, `member`, `customer`) are enforced at the PostgreSQL engine level, physically guaranteeing zero cross-tenant data leaks.
            </p>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="border-t border-white/[0.08] bg-surface/80 py-8 px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <MerkatoLogo size="sm" />

          <div className="flex items-center gap-4 text-xs text-white/60">
            <Link href="/login" className="hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-white transition-colors">
              Create Workspace
            </Link>
            <ThemeSelector />
          </div>

          <div className="text-[11px] text-white/40 font-mono w-full sm:w-auto text-center sm:text-right">
            © 2026 Merkato · Built with Next.js 14 &amp; Supabase PostgreSQL
          </div>
        </div>
      </footer>
    </div>
  );
}
