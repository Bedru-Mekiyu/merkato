"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/app/(app)/settings/invites/actions";

export function AcceptInviteClient({
  token,
  orgSlug,
}: {
  token: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    const result = await acceptInvitation(token);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    // Redirect into the workspace the invitation just joined.
    router.push(result.orgSlug ? `/dashboard?workspace=${result.orgSlug}` : "/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-sm px-3 py-2">
          {error}
        </div>
      )}

      <Button
        onClick={handleAccept}
        loading={loading}
        className="w-full"
      >
        Accept invitation
      </Button>

      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard")}
        className="w-full"
      >
        Decline
      </Button>
    </div>
  );
}
