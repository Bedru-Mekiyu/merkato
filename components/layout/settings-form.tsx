"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateProfile, updateWorkspace } from "@/app/(app)/settings/actions";
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

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [orgLoading, setOrgLoading] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  async function handleProfileSubmit(formData: FormData) {
    setProfileLoading(true);
    setProfileSaved(false);
    await updateProfile(formData);
    setProfileLoading(false);
    setProfileSaved(true);
    router.refresh();
    setTimeout(() => setProfileSaved(false), 2000);
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
    setTimeout(() => setOrgSaved(false), 2000);
  }

  const canEditWorkspace = role === "owner" || role === "admin";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Full name
              </label>
              <Input name="full_name" defaultValue={fullName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Email
              </label>
              <Input value={email} disabled className="opacity-60" />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={profileLoading} size="sm">
                Save changes
              </Button>
              {profileSaved && (
                <span className="text-xs text-success">Saved</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleOrgSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Workspace name
              </label>
              <Input name="name" defaultValue={orgName} disabled={!canEditWorkspace} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1.5">
                Workspace URL
              </label>
              <Input value={`merkato.app/${orgSlug}`} disabled className="opacity-60" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Your role:</span>
              <Badge variant="accent" className="capitalize">{role}</Badge>
            </div>

            {orgError && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
                {orgError}
              </div>
            )}

            {canEditWorkspace && (
              <div className="flex items-center gap-3">
                <Button type="submit" loading={orgLoading} size="sm">
                  Save changes
                </Button>
                {orgSaved && <span className="text-xs text-success">Saved</span>}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      {canEditWorkspace && (
        <Card>
          <CardHeader>
            <CardTitle>Security &amp; Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/settings/invites"
              className="flex items-center gap-2.5 text-sm text-white/80 hover:text-white transition-colors"
            >
              <Shield className="h-4 w-4 text-accent" />
              Team Members &amp; Invitations
              <span className="ml-auto text-xs text-muted">→</span>
            </Link>
            <Link
              href="/settings/mfa"
              className="flex items-center gap-2.5 text-sm text-white/80 hover:text-white transition-colors"
            >
              <Shield className="h-4 w-4 text-accent" />
              Two-Factor Authentication (MFA)
              <span className="ml-auto text-xs text-muted">→</span>
            </Link>
            <Link
              href="/audit-log"
              className="flex items-center gap-2.5 text-sm text-white/80 hover:text-white transition-colors"
            >
              <Shield className="h-4 w-4 text-accent" />
              View Audit Log
              <span className="ml-auto text-xs text-muted">→</span>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
