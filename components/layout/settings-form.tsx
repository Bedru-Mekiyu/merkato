"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  User,
  Building,
  Palette,
  CheckCircle2,
  Lock,
  Users,
  Activity,
  KeyRound,
  ExternalLink,
  Download,
  Database,
  Sparkles,
  Trash2,
  FileSpreadsheet,
  FileJson,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { updateProfile, updateWorkspace } from "@/app/(app)/settings/actions";
import { useToast } from "@/components/ui/toast";
import type { OrgRole } from "@/types/database";

export function SettingsForm({
  fullName,
  email,
  orgName,
  orgSlug,
  role,
}: {
  fullName: string;
  email: string;
  orgName: string;
  orgSlug: string;
  role: OrgRole;
}) {
  const router = useRouter();
  const { notify } = useToast();

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [orgLoading, setOrgLoading] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [demoLoading, setDemoLoading] = useState(false);

  async function handleProfileSubmit(formData: FormData) {
    setProfileLoading(true);
    setProfileSaved(false);
    await updateProfile(formData);
    setProfileLoading(false);
    setProfileSaved(true);
    router.refresh();
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function handleOrgSubmit(formData: FormData) {
    setOrgLoading(true);
    setOrgSaved(false);
    setOrgError(null);
    const result = await updateWorkspace(formData);
    setOrgLoading(false);
    if (result?.error) {
      setOrgError(result.error);
      return;
    }
    setOrgSaved(true);
    router.refresh();
    setTimeout(() => setOrgSaved(false), 2500);
  }

  async function handleSeedDemoData() {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/workspace/demo-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const data = await res.json();
      if (res.ok) {
        notify("Realistic deals, tasks, tickets, and articles have been generated.", "success");
        router.refresh();
      } else {
        notify(data.error || "Failed to seed demo data.", "error");
      }
    } catch {
      notify("Could not connect to workspace service.", "error");
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleClearData() {
    if (
      !window.confirm(
        "Are you sure you want to clear workspace records (deals, tasks, tickets)? This action is irreversible."
      )
    ) {
      return;
    }

    setDemoLoading(true);
    try {
      const res = await fetch("/api/workspace/demo-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const data = await res.json();
      if (res.ok) {
        notify("Workspace records have been reset.", "success");
        router.refresh();
      } else {
        notify(data.error || "Failed to clear records.", "error");
      }
    } catch {
      notify("Could not connect to workspace service.", "error");
    } finally {
      setDemoLoading(false);
    }
  }

  const canEditWorkspace = role === "owner" || role === "admin";
  const initial = (fullName || email || "?").charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="border-white/[0.08] bg-surface/70 backdrop-blur-md shadow-xl rounded-2xl">
        <CardHeader className="border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-white">Your Profile</CardTitle>
              <p className="text-xs text-white/50 mt-0.5">
                Manage your display identity across team channels and task boards.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <form action={handleProfileSubmit} className="space-y-4">
            <div className="flex items-center gap-4 pb-2">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-secondary border border-white/20 flex items-center justify-center text-xl font-extrabold text-white shadow-[0_0_15px_var(--primary-glow)] shrink-0">
                {initial}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{fullName || "Team Member"}</p>
                <p className="text-[11px] text-white/50 font-mono mt-0.5">{email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="accent" className="capitalize text-[10px]">
                    {role}
                  </Badge>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active Session
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Full name
              </label>
              <Input
                name="full_name"
                defaultValue={fullName}
                placeholder="Ada Lovelace"
                className="bg-black/30 border-white/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Email address
              </label>
              <Input
                value={email}
                disabled
                className="opacity-60 bg-black/40 border-white/10 cursor-not-allowed font-mono text-xs"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" loading={profileLoading} size="sm">
                Save Profile
              </Button>
              {profileSaved && (
                <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Changes saved
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Workspace Branding */}
      <Card className="border-white/[0.08] bg-surface/70 backdrop-blur-md shadow-xl rounded-2xl">
        <CardHeader className="border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-white">Workspace Configuration</CardTitle>
              <p className="text-xs text-white/50 mt-0.5">
                Organization tenant parameters and public customer portal domain.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <form action={handleOrgSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Workspace name
              </label>
              <Input
                name="name"
                defaultValue={orgName}
                disabled={!canEditWorkspace}
                className="bg-black/30 border-white/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Customer Support Portal URL
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={`/portal/${orgSlug}`}
                  disabled
                  className="opacity-70 bg-black/40 border-white/10 font-mono text-xs flex-1"
                />
                <Link
                  href={`/portal/${orgSlug}`}
                  target="_blank"
                  className="h-10 px-3.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-medium text-white/80 hover:text-white hover:bg-white/[0.08] flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <span>Visit Portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {orgError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3.5 py-2.5">
                {orgError}
              </div>
            )}

            {canEditWorkspace ? (
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" loading={orgLoading} size="sm">
                  Update Workspace
                </Button>
                {orgSaved && (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 animate-fade-in">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Workspace updated
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-white/40 italic">
                Only workspace Owners and Admins can modify organization settings.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Enterprise Data Portability & Backups */}
      <Card className="border-white/[0.08] bg-surface/70 backdrop-blur-md shadow-xl rounded-2xl">
        <CardHeader className="border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-white">Data Portability &amp; Backups</CardTitle>
              <p className="text-xs text-white/50 mt-0.5">
                Download structured backups and export CSV files for CRM deals, tasks, contacts, and tickets.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="/api/workspace/export?format=json"
              download
              className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/40 transition-all group"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <FileJson className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">
                  Complete Workspace Backup (JSON)
                </p>
                <p className="text-[11px] text-white/50">Full relational database export</p>
              </div>
              <Download className="h-4 w-4 text-white/40 group-hover:text-white transition-colors shrink-0" />
            </a>

            <a
              href="/api/workspace/export?format=csv&resource=deals"
              download
              className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/40 transition-all group"
            >
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Export CRM Deals (CSV)
                </p>
                <p className="text-[11px] text-white/50">Pipelines, values, and stages</p>
              </div>
              <Download className="h-4 w-4 text-white/40 group-hover:text-white transition-colors shrink-0" />
            </a>

            <a
              href="/api/workspace/export?format=csv&resource=tasks"
              download
              className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/40 transition-all group"
            >
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                  Export Sprint Tasks (CSV)
                </p>
                <p className="text-[11px] text-white/50">Task priorities and statuses</p>
              </div>
              <Download className="h-4 w-4 text-white/40 group-hover:text-white transition-colors shrink-0" />
            </a>

            <a
              href="/api/workspace/export?format=csv&resource=contacts"
              download
              className="flex items-center gap-3 p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/40 transition-all group"
            >
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  Export Contacts (CSV)
                </p>
                <p className="text-[11px] text-white/50">Client emails, names, and titles</p>
              </div>
              <Download className="h-4 w-4 text-white/40 group-hover:text-white transition-colors shrink-0" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Sales Presentation & Demo Controls */}
      {canEditWorkspace && (
        <Card className="border-white/[0.08] bg-surface/70 backdrop-blur-md shadow-xl rounded-2xl">
          <CardHeader className="border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white">Sales Demo &amp; Presentation Mode</CardTitle>
                <p className="text-xs text-white/50 mt-0.5">
                  Populate realistic startup demo data across all 8 modules for client walkthroughs and pitches.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <p className="text-xs text-white/60 leading-relaxed">
              Instantly seed realistic companies (Acme, Stripe, Vercel), deals ($300k+ pipeline), sprint tasks with subtask checklists, support tickets, and knowledge base articles with 1 click.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleSeedDemoData}
                loading={demoLoading}
                size="sm"
                className="bg-primary hover:bg-primary-hover shadow-[0_0_12px_var(--primary-glow)]"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                <span>Generate Realistic Demo Data</span>
              </Button>

              <button
                type="button"
                onClick={handleClearData}
                disabled={demoLoading}
                className="h-9 px-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-white/70 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Workspace Records</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Engine */}
      <Card className="border-white/[0.08] bg-surface/70 backdrop-blur-md shadow-xl rounded-2xl">
        <CardHeader className="border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-white">Appearance &amp; Theme Engine</CardTitle>
              <p className="text-xs text-white/50 mt-0.5">
                Switch instantly between 4 curated high-contrast theme presets with zero layout flash.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <ThemeSelector variant="full" />
        </CardContent>
      </Card>

      {/* Security & Access Shortcuts */}
      {canEditWorkspace && (
        <Card className="border-white/[0.08] bg-surface/70 backdrop-blur-md shadow-xl rounded-2xl">
          <CardHeader className="border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white">Security &amp; Administration</CardTitle>
                <p className="text-xs text-white/50 mt-0.5">
                  Two-factor authentication, team member invitations, audit logs, and system health.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 divide-y divide-white/[0.04]">
            <Link
              href="/settings/invites"
              className="flex items-center justify-between py-3 text-xs text-white/80 hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold text-white">Team Members &amp; Invitations</p>
                  <p className="text-[11px] text-white/50">Manage workspace roles and pending invitations</p>
                </div>
              </div>
              <span className="text-xs text-white/40 group-hover:text-primary transition-colors">→</span>
            </Link>

            <Link
              href="/settings/mfa"
              className="flex items-center justify-between py-3 text-xs text-white/80 hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <KeyRound className="h-4 w-4 text-indigo-400" />
                <div>
                  <p className="font-semibold text-white">Two-Factor Authentication (TOTP MFA)</p>
                  <p className="text-[11px] text-white/50">Enforce hardware/authenticator app second-factor security</p>
                </div>
              </div>
              <span className="text-xs text-white/40 group-hover:text-primary transition-colors">→</span>
            </Link>

            <Link
              href="/audit-log"
              className="flex items-center justify-between py-3 text-xs text-white/80 hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="font-semibold text-white">Compliance Audit Log</p>
                  <p className="text-[11px] text-white/50">Cryptographic record of all administrative operations</p>
                </div>
              </div>
              <span className="text-xs text-white/40 group-hover:text-primary transition-colors">→</span>
            </Link>

            <Link
              href="/cluster"
              className="flex items-center justify-between py-3 text-xs text-white/80 hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Activity className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="font-semibold text-white">Live System Telemetry &amp; Diagnostics</p>
                  <p className="text-[11px] text-white/50">Database round-trip probes and edge runtime monitoring</p>
                </div>
              </div>
              <span className="text-xs text-white/40 group-hover:text-primary transition-colors">→</span>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
