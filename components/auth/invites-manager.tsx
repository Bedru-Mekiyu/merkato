"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2, Clock, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendInvitation, revokeInvitation } from "@/app/(app)/settings/invites/actions";

interface Invitation {
  id: string;
  email: string;
  role: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export function InvitesManager({
  invitations,
  members,
  orgName,
}: {
  invitations: Invitation[];
  members: { userId: string; role: string; name: string }[];
  orgName: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function handleSend(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await sendInvitation(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    const email = String(formData.get("email") ?? "");
    setSuccess(`Invitation sent to ${email}`);
    formRef.current?.reset();
    router.refresh();
    setTimeout(() => setSuccess(null), 4000);
  }

  async function handleRevoke(id: string) {
    setRevoking(id);
    await revokeInvitation(id);
    setRevoking(null);
    router.refresh();
  }

  const pending = invitations.filter(
    (i) => !i.accepted_at && new Date(i.expires_at) > new Date()
  );
  const expired = invitations.filter(
    (i) => !i.accepted_at && new Date(i.expires_at) <= new Date()
  );
  const accepted = invitations.filter((i) => i.accepted_at);

  return (
    <div className="space-y-6">
      {/* Send invitation form */}
      <Card>
        <CardHeader>
          <CardTitle>Invite a team member</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={handleSend} className="flex flex-col sm:flex-row gap-3">
            <Input
              name="email"
              type="email"
              placeholder="colleague@company.com"
              required
              className="flex-1"
            />
            <select
              name="role"
              defaultValue="member"
              className="h-10 px-3 rounded-sm bg-surface border border-border text-sm text-white focus:border-accent focus:ring-1 focus:ring-accent sm:w-32"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <Button type="submit" loading={loading} size="md">
              <Mail className="h-4 w-4" />
              Send invite
            </Button>
          </form>
          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2 mt-3">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-success bg-success/10 border border-success/20 rounded-sm px-3 py-2 mt-3">
              ✓ {success}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Current Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {members.map((m) => (
              <div key={m.userId} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-medium text-accent">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white">{m.name}</span>
                </div>
                <Badge variant="default" className="capitalize">{m.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Invitations ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pending.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-white">{inv.email}</p>
                    <p className="text-xs text-muted mt-0.5">
                      <span className="capitalize">{inv.role}</span> · Expires{" "}
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    disabled={revoking === inv.id}
                    className="h-7 w-7 flex items-center justify-center rounded-sm text-faint hover:text-danger hover:bg-danger/10 transition-all"
                    title="Revoke invitation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accepted invitations */}
      {accepted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Accepted ({accepted.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {accepted.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-muted">{inv.email}</p>
                  <Badge variant="success">Joined</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
